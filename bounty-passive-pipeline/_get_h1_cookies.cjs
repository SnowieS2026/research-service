const sqlite3 = require('sqlite3');
const path = require('path');
const os = require('os');

const cookiePath = path.join(os.homedir(), 'AppData', 'Local', 'Google', 'Chrome', 'User Data', 'Default', 'Network', 'Cookies');

try {
  const db = new sqlite3.Database(cookiePath, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
      console.log('Cookie DB error (Chrome may be running or not found): ' + err.message);
      process.exit(1);
    }
  });
  
  db.all("SELECT host_key, name, value, encrypted_value FROM cookies WHERE host_key LIKE '%hackerone%'", (err, rows) => {
    if (err) {
      console.log('Query error: ' + err.message);
      db.close();
      process.exit(1);
    }
    
    if (rows.length === 0) {
      console.log('No hackerone cookies found in Chrome');
    } else {
      rows.forEach(r => {
        const hasEnc = r.encrypted_value ? 'YES len=' + r.encrypted_value.length : 'NO';
        console.log('Cookie: ' + r.name + ' | host: ' + r.host_key + ' | encrypted: ' + hasEnc);
      });
    }
    db.close();
    process.exit(0);
  });
} catch(e) {
  console.log('Error: ' + e.message);
  process.exit(1);
}
