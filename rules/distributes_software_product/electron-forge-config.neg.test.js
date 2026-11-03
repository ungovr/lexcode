// lexcode-expect: 0
// A bundler configuration: it builds a web bundle and packages no desktop installer.
module.exports = {
  mode: 'production',
  entry: { main: './src/index.js' },
  module: {
    rules: [{ test: /\.jsx?$/, exclude: /node_modules/, use: 'babel-loader' }],
  },
  plugins: [],
};
