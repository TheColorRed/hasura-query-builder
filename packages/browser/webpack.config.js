const merge = require('webpack-merge');
const path = require('path');
const core = require('../webpack.config.js');

module.exports = merge.merge(core, {
  entry: "./src/index.ts",
  output: {
    path: path.resolve(__dirname, 'dist/lib'),
    filename: "browser.js",
    library: {
      type: 'umd',
      name: 'hasuraQueryBuilderBrowser',
    }
  },
});