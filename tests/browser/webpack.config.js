const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');

/**
 * @type {import('webpack').Configuration}
 */
module.exports = {
  entry: {
    jsx: {
      import: './src/jsx.ts',
      library: { type: 'this' }
    },
    main: {
      dependOn: 'jsx',
      import: './src/index.ts',
      // library: { type: 'this' }
    }
  },
  mode: 'development',
  devtool: 'inline-source-map',
  target: 'web',
  output: {
    filename: '[name].bundle.js',
    publicPath: '/',
    path: path.resolve(__dirname, 'dist'),
  },
  devServer: {
    static: {
      directory: path.join(__dirname, 'assets'),
    },
    server: 'https',
    compress: true,
    port: 9000,
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: 'Hasura Query Builder',
      template: './src/index.html',
      scriptLoading: 'defer',
      inject: 'head',
      hash: true,
    })
  ],
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
    fallback: {
      https: require.resolve('https-browserify'),
      util: require.resolve('util/')
    }
  },
};