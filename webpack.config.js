const MiniCSSPlugin = require('mini-css-extract-plugin')

const mode = process.env.NODE_ENV || 'development'
const isDev = mode === 'development'

module.exports = {
  mode,
  entry: {
    index: './src/'
  },
  output: {
    library: isDev ? '_JiraExtensionScript' : 'JiraExtensionScript',
    libraryTarget: 'umd',
  },
  devServer: {
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json', '.wasm']
  },
  module: {
    rules: [
      {
        oneOf: [
          {
            test: /\.(tsx?|jsx?)$/,
            loader: 'babel-loader',
            options: {
              plugins: []
            }
          },
          {
            test: /\.s[ac]ss$/i,
            use: [MiniCSSPlugin.loader, 'css-loader', 'sass-loader']
          },
          {
            test: /\.css$/i,
            use: [MiniCSSPlugin.loader, 'css-loader']
          }
        ]
      }
    ]
  },
  plugins: [new MiniCSSPlugin()]
}
