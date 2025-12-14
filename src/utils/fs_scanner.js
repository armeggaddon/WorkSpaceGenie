const fs = require('fs');
const path = require('path');
const { writeLog } = require('./scribe');

async function scanFiles(dir, logPath) {
  let collected = [];
  const entries = fs.readdirSync(dir);

  for (const ent of entries) {
    const full = path.join(dir, ent);
    const st = fs.statSync(full);
    if (st.isDirectory()) {
      collected = collected.concat(await scanFiles(full, logPath));
    } else {
      if (path.basename(full) !== 'genie-log.txt' && !full.includes('genie_outputs')) {
        collected.push(full);
        writeLog(logPath, full);
      }
    }
  }

  return collected;
}

module.exports = { scanFiles };
