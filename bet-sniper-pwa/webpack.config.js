const path = require('path');

module.exports = {
  module: {
    rules: [
      {
        test: /\.js$/,
        include: /node_modules[\\/]@base-org[\\/]account/,
        enforce: 'pre',
        use: [path.resolve(__dirname, 'webpack/strip-import-attributes-loader.js')],
      },
    ],
  },
};
