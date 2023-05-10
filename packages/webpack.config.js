const nodeExternals = require('webpack-node-externals');
/**
 * @type {import('webpack').Configuration}
*/
module.exports = {
  // devtool: 'inline-source-map',
  externals: [nodeExternals()],
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
    fallback: {
      https: require.resolve('https-browserify'),
      util: require.resolve('util/')
    }
  },
};