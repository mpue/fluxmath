const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = (env, argv) => {
  const isDev = argv.mode === 'development';
  const isElectron = !!(env && env.electron);

  return {
    entry: './src/index.tsx',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: isDev ? '[name].js' : '[name].[contenthash].js',
      publicPath: isElectron ? './' : '/',
      clean: true,
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js'],
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader'],
        },
      ],
    },
    plugins: [
      new webpack.DefinePlugin({
        'process.env.IS_ELECTRON': JSON.stringify(isElectron),
      }),
      new HtmlWebpackPlugin({
        template: './public/index.html',
        title: 'FluxMath — Interaktive Mathematik',
      }),
      new CopyWebpackPlugin({
        patterns: [
          { from: 'public/*.mp3', to: '[name][ext]' },
          { from: 'public/robots.txt', to: '[name][ext]' },
        ],
      }),
    ],
    devServer: {
      port: 3000,
      hot: true,
      historyApiFallback: true,
      open: true,
    },
    devtool: isDev ? 'eval-source-map' : 'source-map',
  };
};
