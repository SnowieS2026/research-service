// Article Store -- SQLite logger for all scraped articles
// Every article scraped is logged here for weekly roundup reference

import Database from "better-sqlite3";
import * as path from "path";
import * as fs from "fs";

export type Beat = "tech" | "finance" | "geopolitics";
export type Relevance = "high" | "medium" | "low";

export interface StoredArticle {
  id?: number;
  url: string;
  title: string;
  domain: string;
  beat: Beat;
  relevance: Relevance;
  content?: string;
  description?: string;
  published_date?: string;
  scraped_at: string;
  used_in?: string;
  notes?: string;
}

export type ArticleRow = {
  id: number;
  url: string;
  title: string;
  domain: string;
  beat: Beat;
  relevance: Relevance;
  content: string | null;
  description: string | null;
  published_date: string | null;
  scraped_at: string;
  used_in: string | null;
  notes: string | null;
};

export class ArticleStore {
  private db: Database.Database;

  constructor(dbPath?: string) {
    const defaultPath = path.join(__dirname, "..", "article-db.sqlite");
    this.db = new Database(dbPath || defaultPath);
    this.db.pragma("journal_mode = WAL");
    this.db.pragma("foreign_keys = ON");
    this.init();
  }

  private init() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS articles (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        url             TEXT UNIQUE NOT NULL,
        title           TEXT NOT NULL,
        domain          TEXT NOT NULL,
        beat            TEXT NOT NULL CHECK(beat IN ('tech','finance','geopolitics')),
        relevance       TEXT NOT NULL CHECK(relevance IN ('high','medium','low')),
        content         TEXT,
        description     TEXT,
        published_date  TEXT,
        scraped_at      TEXT NOT NULL,
        used_in         TEXT,
        notes           TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_articles_date   ON articles(scraped_at);
      CREATE INDEX IF NOT EXISTS idx_articles_beat   ON articles(beat);
      CREATE INDEX IF NOT EXISTS idx_articles_used    ON articles(used_in);
      CREATE INDEX IF NOT EXISTS idx_articles_domain  ON articles(domain);
    `);
  }

  /** Log a scraped article -- upsert by URL (idempotent) */
  upsert(article: Omit<StoredArticle, "id">): number {
    const existing = this.db.prepare("SELECT id FROM articles WHERE url = ?").get(article.url) as { id: number } | undefined;
    if (existing) {
      this.db.prepare(`
        UPDATE articles SET
          title = ?, domain = ?, beat = ?, relevance = ?,
          content = ?, description = ?, published_date = ?, scraped_at = ?
        WHERE url = ?
      `).run(
        article.title, article.domain, article.beat, article.relevance,
        article.content || null, article.description || null,
        article.published_date || null, article.scraped_at,
        article.url
      );
      return existing.id;
    } else {
      const result = this.db.prepare(`
        INSERT INTO articles (url, title, domain, beat, relevance, content, description, published_date, scraped_at, used_in, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        article.url, article.title, article.domain, article.beat, article.relevance,
        article.content || null, article.description || null,
        article.published_date || null, article.scraped_at,
        article.used_in || null, article.notes || null
      );
      return result.lastInsertRowid as number;
    }
  }

  /** Mark an article as used in a specific report */
  markUsed(urls: string[], usedIn: string) {
    const stmt = this.db.prepare("UPDATE articles SET used_in = ? WHERE url = ?");
    const updateMany = this.db.transaction((urls: string[]) => {
      for (const url of urls) stmt.run(usedIn, url);
    });
    updateMany(urls);
  }

  /** Get all articles scraped today (for daily report) */
  todayArticles(): ArticleRow[] {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    return this.db.prepare(`
      SELECT * FROM articles WHERE scraped_at LIKE ? ORDER BY relevance DESC, scraped_at DESC
    `).all(`${today}%`) as ArticleRow[];
  }

  /** Get all articles from the last N days (for weekly roundup) */
  recentArticles(days: number = 7): ArticleRow[] {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    return this.db.prepare(`
      SELECT * FROM articles WHERE scraped_at >= ? ORDER BY relevance DESC, scraped_at DESC
    `).all(cutoff) as ArticleRow[];
  }

  /** Get articles by beat, optionally filtered by date */
  byBeat(beat: Beat, since?: string): ArticleRow[] {
    if (since) {
      return this.db.prepare(`
        SELECT * FROM articles WHERE beat = ? AND scraped_at >= ? ORDER BY relevance DESC
      `).all(beat, since) as ArticleRow[];
    }
    return this.db.prepare(`
      SELECT * FROM articles WHERE beat = ? ORDER BY relevance DESC
    `).all(beat) as ArticleRow[];
  }

  /** Get unused articles (not yet in any report) */
  unusedArticles(since?: string): ArticleRow[] {
    if (since) {
      return this.db.prepare(`
        SELECT * FROM articles WHERE used_in IS NULL AND scraped_at >= ? ORDER BY relevance DESC
      `).all(since) as ArticleRow[];
    }
    return this.db.prepare(`
      SELECT * FROM articles WHERE used_in IS NULL ORDER BY relevance DESC
    `).all() as ArticleRow[];
  }

  /** Full text search across all article fields */
  search(query: string, limit = 20): ArticleRow[] {
    const q = `%${query}%`;
    return this.db.prepare(`
      SELECT * FROM articles
      WHERE title LIKE ? OR content LIKE ? OR description LIKE ?
      ORDER BY scraped_at DESC LIMIT ?
    `).all(q, q, q, limit) as ArticleRow[];
  }

  /** Count articles by beat for a given period */
  beatCounts(since?: string): Record<Beat, number> {
    const rows = since
      ? this.db.prepare(`SELECT beat, COUNT(*) as count FROM articles WHERE scraped_at >= ? GROUP BY beat`).all(since) as Array<{ beat: Beat; count: number }>
      : this.db.prepare(`SELECT beat, COUNT(*) as count FROM articles GROUP BY beat`).all() as Array<{ beat: Beat; count: number }>;
    return { tech: 0, finance: 0, geopolitics: 0, ...Object.fromEntries(rows.map(r => [r.beat, r.count])) };
  }

  close() { this.db.close(); }
}
