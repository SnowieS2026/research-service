// BeeHiiv API publish module
// Credentials loaded from workspace credentials file

import * as fs from "fs";
import * as path from "path";

const CREDS_PATH = path.join(process.env.WORKSPACE_DIR || "C:\\Users\\bryan\\.openclaw\\workspace", "credentials", "beehiiv.json");

export interface BeeHiivCredentials {
  api_key: string;
  publication_id_v1: string;
  publication_id_v2: string;
  base_url: string;
}

export interface BeeHiivPost {
  id: string;
  title: string;
  status: "draft" | "published";
  web_url?: string;
}

function loadCredentials(): BeeHiivCredentials {
  try {
    const raw = fs.readFileSync(CREDS_PATH, "utf8");
    return JSON.parse(raw).beehiiv;
  } catch {
    throw new Error(`BeeHiiv credentials not found at ${CREDS_PATH}`);
  }
}

async function beehiivFetch(endpoint: string, options: RequestInit = {}) {
  const creds = loadCredentials();
  const url = `${creds.base_url}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      "Authorization": `Bearer ${creds.api_key}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...options.headers,
    },
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`BeeHiiv API error ${response.status}: ${body}`);
  }
  return response.json() as Promise<Record<string, unknown>>;
}

export interface CreatePostOptions {
  title: string;
  content: string;          // HTML or Markdown
  contentFormat: "html" | "markdown";
  publish?: boolean;         // true = auto-publish, false = draft (default: draft)
  emailIteHtml?: string;     // Optional email HTML (if not, uses web content)
}

export async function createPost(options: CreatePostOptions): Promise<BeeHiivPost> {
  const creds = loadCredentials();

  const payload: Record<string, unknown> = {
    title: options.title,
    content: options.content,
    content_format: options.contentFormat,
    // BeeHiiv v2 uses publish_type: 'now' | 'schedule' | 'draft'
    publish_type: options.publish ? "now" : "draft",
  };

  const result = await beehiivFetch(`/publications/${creds.publication_id_v2}/posts`, {
    method: "POST",
    body: JSON.stringify(payload),
  }) as { data?: { id: string; web_url?: string; status?: string; title?: string } };

  return {
    id: result.data?.id || "unknown",
    title: result.data?.title || options.title,
    status: result.data?.status === "published" ? "published" : "draft",
    web_url: result.data?.web_url,
  };
}

export async function publishPost(postId: string): Promise<void> {
  await beehiivFetch(`/publications/${loadCredentials().publication_id_v2}/posts/${postId}/publish`, {
    method: "POST",
  });
}

export async function getPublication(): Promise<Record<string, unknown>> {
  const creds = loadCredentials();
  return beehiivFetch(`/publications/${creds.publication_id_v2}`);
}

export async function listPosts(limit = 10): Promise<BeeHiivPost[]> {
  const creds = loadCredentials();
  const result = await beehiivFetch(`/publications/${creds.publication_id_v2}/posts?limit=${limit}`) as { data?: Array<{ id: string; title: string; status: string; web_url?: string }> };
  return (result.data || []).map(p => ({
    id: p.id, title: p.title, status: p.status === "published" ? "published" : "draft", web_url: p.web_url,
  }));
}

export async function getPost(postId: string): Promise<BeeHiivPost> {
  const creds = loadCredentials();
  const result = await beehiivFetch(`/publications/${creds.publication_id_v2}/posts/${postId}`) as { data?: { id: string; title: string; status: string; web_url?: string } };
  return {
    id: result.data?.id || postId,
    title: result.data?.title || "",
    status: result.data?.status === "published" ? "published" : "draft",
    web_url: result.data?.web_url,
  };
}

/** Convert Markdown newsletter to basic HTML for BeeHiiv */
export function markdownToHtml(markdown: string): string {
  // Simple Markdown → HTML conversion for BeeHiiv
  // BeeHiiv accepts HTML in the content field
  let html = markdown;

  // Headers
  html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  // Italic
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Links — extract as text (BeeHiiv handles links differently)
  // Replace [text](url) with just text, bold the text
  html = html.replace(/\[(.+?)\]\(.+?\)/g, '<strong>$1</strong>');

  // Horizontal rules
  html = html.replace(/^---$/gm, '<hr/>');

  // Paragraphs — split on double newlines
  const lines = html.split(/\n\n+/);
  html = lines
    .map(p => {
      p = p.trim();
      if (!p) return "";
      if (p.startsWith("<h") || p.startsWith("<hr")) return p;
      return `<p>${p.replace(/\n/g, "<br/>")}</p>`;
    })
    .join("\n");

  // Clean up BeeHiiv-specific tags
  html = html.replace(/<p><hr\/><\/p>/g, '<hr/>');
  html = html.replace(/<p><\/p>/g, '');

  return html;
}
