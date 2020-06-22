const { Plugin } = require('release-it');
const fs = require('fs');
const path = require('path');

function bumpImpl(version) {
  const desc = path.resolve('./pbiviz.json');
  const content = require(desc);
  content.visual.version = version;
  fs.writeFileSync(desc, JSON.stringify(content, null, 2) + '\n');
}

class MyVersionPlugin extends Plugin {
  bump(version) {
    bumpImpl(version);
  }
}

module.exports = MyVersionPlugin;
