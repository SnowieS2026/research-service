import { memory } from './src/vector-store.js';

const cred = {
  beehiiv: {
    api_key: 'WfncsNDfviwghnWPHYpVP7x6wd1CMXOK4kSKWlKIPDEu97nUueWVQHsWuMyWxwKY',
    publication_id_v1: '7e46fcb0-239b-4079-ada4-78bb13137de0',
    publication_id_v2: 'pub_7e46fcb0-239b-4079-ada4-78bb13137de0',
    base_url: 'https://api.beehiiv.com/v2',
    newsletter_name: 'Prismal',
    stored: '2026-03-27',
  }
};

await memory.add([{
  id: 'cred:beehiiv.json',
  content: JSON.stringify(cred, null, 2),
  metadata: { type: 'credential', file: 'beeading-platforms.json', sensitive: true, service: 'beehiiv', newsletter: 'Prismal', ingestedAt: Date.now() }
}]);

console.log('BeeHiiv credentials indexed to vector store. Collection count:', await memory.count());
