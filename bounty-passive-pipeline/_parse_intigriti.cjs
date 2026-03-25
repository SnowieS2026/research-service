const fs = require('fs');
const html = fs.readFileSync('C:/Users/bryan/.openclaw/workspace/bounty-passive-pipeline/logs/intigriti-programs.json', 'utf8');
const match = html.match(/"InstantSearchInitialResults":\{.*?\}/);
if (match) {
  const data = JSON.parse(match[0].replace('"InstantSearchInitialResults":', ''));
  const hits = data.results[0].hits;
  console.log('Total programs:', data.results[0].nbHits);
  hits.forEach(h => {
    console.log(h.handle + ' | ' + h.name + ' | ' + h.minBounty.value + '-' + h.maxBounty.value + ' ' + h.maxBounty.currency + ' | ' + h.industryName);
  });
}
