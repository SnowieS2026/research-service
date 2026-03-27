import requests
import json

# Embed content
content = open('C:/Users/bryan/.openclaw/workspace/reports/income/high-ticket-automation-ideas.md', 'r').read()

r = requests.post('http://localhost:11434/api/embeddings', json={'model': 'nomic-embed-text', 'prompt': content[:8000]})
embedding = r.json()['embedding']

col_id = '30b90900-28a6-4e72-a661-4ce733e8bf44'
doc_id = 'income-high-ticket-automation-ideas-2026-03-27'
payload = {
    'ids': [doc_id],
    'embeddings': [embedding],
    'documents': [content],
    'metadatas': [{'source': 'report', 'type': 'income_ideas', 'date': '2026-03-27'}]
}

# Try api/v2 endpoint
r2 = requests.post(f'http://localhost:8000/api/v2/collections/{col_id}/add', json=payload)
print(f'api/v2 add: {r2.status_code} - {r2.text[:200]}')

# Also try the older endpoint style
payload2 = {'ids': [doc_id], 'documents': [content], 'embeddings': [embedding]}
r3 = requests.post(f'http://localhost:8000/collections/{col_id}/add', json=payload2)
print(f'legacy add: {r3.status_code} - {r3.text[:200]}')
