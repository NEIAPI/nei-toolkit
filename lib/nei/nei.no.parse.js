let path = require('path');
let minimatch = require("minimatch");

/**
 * NEI忽略文件解析功能实现
 */
class NeiNoParse {
  constructor(ruleContent, root) {
    this.rules = ruleContent.split('\n').filter(r => {
      return r != ""
    });
    this.root = root;
  }

  dontParse(filePath) {
    let relativePath = path.relative(this.root, filePath);
    let result = this.rules.some(rule => {
      return minimatch(relativePath, rule);
    });
    return result;
  }
}
module.exports = NeiNoParse;

