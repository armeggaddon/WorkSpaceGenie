const fs = require('fs');

function writeLog(path, msg) {
  const stamp = new Date().toISOString();
  if (!path) return;
  fs.appendFileSync(path, `[${stamp}] ${msg}\n`);
}

module.exports = { writeLog };
