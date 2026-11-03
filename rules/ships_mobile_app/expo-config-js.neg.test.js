// lexcode-expect: 0
// A webpack configuration is not an app configuration: nothing here names a store identity.
const path = require('node:path');

module.exports = {
  mode: 'production',
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
  },
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
};
