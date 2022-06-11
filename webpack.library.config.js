const path = require ('path');
const TerserPlugin = require('terser-webpack-plugin');

const config = {
  mode: 'production',
  entry: './src/Backend.ts',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '_ob2ss.bundle.js',
    libraryTarget: 'var',
    library: '_AppLib_'
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: ['ts-loader'],
        exclude: /node_modules/,
      },
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              [
                '@babel/preset-env',
                {
                  useBuiltIns: 'usage'
                }
              ]
            ]
          }
        }
      }
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
};

module.exports = config;
