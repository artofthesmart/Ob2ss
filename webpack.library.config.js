const path = require ('path');
const TerserPlugin = require('terser-webpack-plugin');
const GasPlugin = require('gas-webpack-plugin');

const config = {
  mode: 'production',
  entry: './src/api.ts',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'ob2ss.bundle.js',
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: ['ts-loader'],
        exclude: /node_modules/,
      },
    ],
  },

  // Required to copy function comments to the library.
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          mangle: false,
          output: {
            comments: true///@customFunction/i,
          },
        },
      }),
    ],
  },
  resolve: {
    extensions: ['.ts'],
  },

  // Required to ensure API functions are exposed by the library.
  plugins: [
    new GasPlugin()
  ]
};

module.exports = config;
