import { searxngSearch } from './dist/src/osint/http.js';

console.log('Testing searxngSearch...');
const r = await searxngSearch('Donald Trump', 5);
console.log('Results:', r.length);
r.forEach(x => console.log(' -', x.title));
