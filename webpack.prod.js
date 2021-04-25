const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const CopyPlugin = require("copy-webpack-plugin");

module.exports = merge(common, {
  mode: 'production',
  devtool: 'source-map'
});

module.exports = merge(common, {
  mode: 'production',
  devtool: 'source-map',
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: "E-XX.3ds", to: "" },
        { from: "E755.3ds", to: "" },
        { from: "E755W.3ds", to: "" },
        { from: "gridtexture2.png", to: "" },
      ],
    }),
  ],
});