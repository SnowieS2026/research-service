# Social Media OSINT

## Description
Researches social media accounts, maps follower networks, tracks posting patterns, and cross-references social presence across platforms. Combines with username OSINT (Maigret/Sherlock) for comprehensive social media profiling.

## Tools Available

### Social Blade — Stats and Analytics
Track follower history, estimate earnings, detect bot activity.

```
python tools/osint-toolkit.py socialblade <username>
```
Opens Social Blade for: Twitter, YouTube, Instagram, Twitch.

**What to look for:**
- Follower count history (sudden spikes = bought followers or viral)
- Estimated earnings (YouTube/Twitch — reveals audience size)
- User reputation score
- Similar accounts

### Pushshift / Reddit — Historical Reddit Data
Pushshift is the archive of all Reddit data. Use to:
- Find deleted Reddit posts and comments
- Map posting history and interests
- Build a behavioural profile

```
python tools/osint-toolkit.py reddit <username>
```
Opens Reddit profile + Pushshift archive link.

**Direct Pushshift queries:**
- https://npm.micu.io/?q=author%3A<username>&network=reddit
- https://redditsearch.io/?term=<username>&author=<username>&dataviz=false

### WhatsMyName — Username Across 400+ Sites
```
python tools/osint-toolkit.py whatsmyname <username>
```
Opens WhatsMyName with the username pre-filled. WhatsMyName cross-references the username across 400+ platforms.

### Hunter.io — Email Patterns for Domains
```
python tools/osint-toolkit.py email-hunter <domain>
```
Opens Hunter.io free search for email patterns on a domain. Useful for:
- Finding corporate email structures (e.g., first.last@company.com)
- Discovering email formats used by an organisation
- Identifying personal vs corporate accounts

## OSINT Workflow for Social Media Investigation

### Step 1: Username sweep
```
python tools/osint-toolkit.py username <target_username>
```
Runs Maigret + Sherlock + Holehe + WhatsMyName simultaneously.

### Step 2: Platform-specific analysis
For each platform found, check:
- Account age vs claimed history (timeline inconsistencies)
- Posting frequency (bots post on schedule)
- Content patterns (reposts vs original content)
- Follower/following ratios (bot indicators)
- Profile photo (run through reverse image)

### Step 3: Cross-platform connections
- Same username across multiple platforms = higher confidence identity match
- Different usernames on same platform = multiple personas
- Email cross-reference: use Holehe to check if emails from different accounts link to same person

### Step 4: Behavioural analysis
- Posting timezone (infers location)
- Topics/content themes (professional, personal, political)
- Hashtag usage (campaign coordination, bot networks)
- @mentions patterns (maps social graph)

## Platform-Specific Tips

### Twitter/X
- Check lists: people who added the account to lists reveal grouping/intent
- Use Social Blade for bot scoring
- Check quote tweet patterns for narrative amplification
- Archive.org for deleted tweets

### Reddit
- Pushshift always has deleted content
- Check posting history for patterns
- Look at subreddits — niche communities reveal interests/affiliations
- Cake day = account age

### YouTube
- Social Blade shows estimated subscribers and earnings
- Check upload schedule consistency
- Look at comment history
- Similar channel recommendations reveal networks

## Integration
- `osint-toolkit.py all <username>` — full sweep
- `osint-toolkit.py username <username>` — Maigret + Sherlock + Holehe
- `osint-toolkit.py socialblade <username>` — stats
- `osint-toolkit.py reddit <username>` — Reddit history
- `osint-toolkit.py whatsmyname <username>` — 400+ site cross-reference
