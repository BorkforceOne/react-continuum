const dev = require('./webpack.dev.config');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')

const prod = {...dev};

prod.devtool = undefined;

prod.plugins = [
  ...dev.plugins,
  new UglifyJsPlugin()
]

module.exports = prod;