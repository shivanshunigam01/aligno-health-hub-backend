const fs = require('fs');
const path = require('path');

const dirs = ['temp', 'logs', 'public'].map((d) => path.join(__dirname, '..', d));

function ensureDirs() {
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }
}

module.exports = ensureDirs;
