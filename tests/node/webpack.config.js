const CircularDependencyPlugin = require('circular-dependency-plugin');

/**
 * @type {import('webpack').Configuration}
 */
module.exports = {
  entry: './src/index.ts',
  mode: 'development',
  devtool: 'inline-source-map',
  target: 'node',
  watch: true,
  performance: {
    maxAssetSize: 1024 * 1024 * 10,
    maxEntrypointSize: 1024 * 1024 * 5,
  },
  optimization: {
    splitChunks: {
      chunks: 'all'
    }
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
      },
    ],
  },
  plugins: [
    new CircularDependencyPlugin({
      exclude: /node_modules/,
      failOnError: true,
      allowAsyncCycles: true,
    })
  ],
  resolve: {
    extensions: ['.ts', '.js'],
    fallback: {
      "https": require.resolve("https-browserify"),
      // "fs": require.resolve("browserify-fs"),
      // "path": require.resolve("path-browserify"),
      // "stream": require.resolve("stream-browserify"),
      // "util": require.resolve("util/"),
      // "buffer": require.resolve("buffer/")
    }
  },
};