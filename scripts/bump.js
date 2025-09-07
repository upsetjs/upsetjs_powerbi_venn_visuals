const { Plugin } = require("release-it");
const fs = require("fs");
const path = require("path");

function bumpImpl(version, fileName) {
  const desc = path.resolve(fileName);
  const content = require(desc);
  content.visual.version = version;
  fs.writeFileSync(desc, JSON.stringify(content, null, 2) + "\n");
}

class MyVersionPlugin extends Plugin {
  bump(version) {
    bumpImpl(version, "./pbiviz.json");
    bumpImpl(version, "./pbiviz_preview.json");
  }
}

module.exports = MyVersionPlugin;
