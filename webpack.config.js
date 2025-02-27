//@ts-check

'use strict';

const path = require('path');

/**@type {import('webpack').Configuration}*/
const config = {
  target: 'node', // vscode extensions run in a Node.js-context
  entry: './src/extension.ts', // the entry point of this extension
  output: {
    // the bundle is stored in the 'out' folder (check package.json)
    path: path.resolve(__dirname, 'out'),
    filename: 'extension.js',
    libraryTarget: 'commonjs2',
    devtoolModuleFilenameTemplate: '../[resource-path]'
  },
  devtool: 'source-map',
  externals: {
    vscode: 'commonjs vscode' // the vscode-module is created on-the-fly and must be excluded
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: [/node_modules/, /src\/test/], // Exclude test files from compilation
        use: [
          {
            loader: 'ts-loader'
          }
        ]
      }
    ]
  },
  mode: 'production' // Set mode to production to avoid the warning
};

module.exports = config;
