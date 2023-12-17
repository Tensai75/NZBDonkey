const path = require('path');

module.exports = {
  configureWebpack: () => {
    if (process.env.NODE_ENV === 'production') {
      return {
        output: {
          hashFunction: 'sha256',
        },
        devtool: false,
      };
    } else {
      return {
        output: {
          hashFunction: 'sha256',
        },
        devtool: 'eval-cheap-module-source-map',
        module: {
          rules: [
            {
              test: /\.js$/,
              enforce: 'pre',
              use: ['source-map-loader'],
            },
          ],
        },
      };
    }
  },
  pages: {
    popup: {
      template: 'public/browser-extension.html',
      entry: './src/popup/main.js',
      title: 'Popup',
    },
    options: {
      template: 'public/browser-extension.html',
      entry: './src/options/main.js',
      title: 'Options',
    },
    targetSelection: {
      template: 'public/browser-extension.html',
      entry: './src/targets/selectTarget.js',
      title: 'Select Target',
    },
    categorySelection: {
      template: 'public/browser-extension.html',
      entry: './src/categories/selectCategory.js',
      title: 'Select Category',
    },
    nzbDialog: {
      template: 'public/browser-extension.html',
      entry: './src/nzbdialog/nzbDialog.js',
      title: 'NZB Donkey Dialog',
    },
  },
  pluginOptions: {
    browserExtension: {
      componentOptions: {
        background: {
          entry: 'src/background/background.js',
        },
        contentScripts: {
          entries: {
            content: ['src/content/main.js'],
          },
        },
      },
      manifestTransformer: (manifest) => {
        if (process.env.BROWSER === 'firefox') {
          manifest.applications = { gecko: {} };
          manifest.applications.gecko.id =
            '{dd77cf0b-b93f-4e9f-8006-b642c02219db}';
          manifest.applications.gecko.strict_min_version = '60.0';
        }
        return manifest;
      },
      artifactsDir: 'dist',
    },
  },
  outputDir: path.resolve(__dirname, 'build', process.env.BROWSER),
};
