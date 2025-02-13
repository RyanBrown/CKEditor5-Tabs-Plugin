// karma.conf.js
const webpackConfig = require('./webpack.config');

module.exports = function (config) {
  // Create a separate webpack config for tests
  const testWebpackConfig = {
    mode: 'development',
    devtool: 'inline-source-map',

    // Keep only the necessary parts from your main webpack config
    resolve: {
      extensions: ['.ts', '.js', '.json']
    },

    module: {
      rules: webpackConfig.module.rules
    },

    plugins: webpackConfig.plugins.filter(plugin =>
      // Keep only necessary plugins, remove optimization-related ones
      !(plugin instanceof require('terser-webpack-plugin'))
    )
  };

  config.set({
    basePath: '',
    frameworks: ['jasmine', 'webpack'],
    files: [
      { pattern: 'src/plugins/**/tests/**/*.spec.ts', type: 'js' }
    ],
    preprocessors: {
      'src/plugins/**/tests/**/*.spec.ts': ['webpack', 'sourcemap']
    },
    webpack: testWebpackConfig,
    webpackMiddleware: {
      stats: 'minimal'
    },
    reporters: ['progress', 'coverage'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    browsers: ['ChromeHeadless'],
    singleRun: true,
    concurrency: Infinity,
    coverageReporter: {
      dir: 'coverage/',
      reporters: [
        { type: 'html', subdir: 'html' },
        { type: 'lcov', subdir: 'lcov' },
        { type: 'text-summary' }
      ]
    }
  });
};