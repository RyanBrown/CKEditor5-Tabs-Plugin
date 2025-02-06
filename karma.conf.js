const webpackConfig = require('./webpack.config');

module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine', 'webpack'],
    files: [
      'src/plugins/**/tests/**/*.spec.ts'
    ],
    preprocessors: {
      'src/plugins/**/tests/**/*.spec.ts': ['webpack'],
      'src/**/*.ts': ['coverage']
    },
    webpack: {
      ...webpackConfig,
      entry: undefined,
      optimization: undefined
    },
    reporters: ['spec', 'coverage'],
    browsers: ['ChromeHeadless'],
    singleRun: false,
    coverageReporter: {
      dir: 'coverage/',
      reporters: [
        { type: 'html', subdir: 'html' },
        { type: 'lcov', subdir: 'lcov' },
        { type: 'text-summary' }
      ]
    },
    webpackMiddleware: {
      stats: 'errors-only'
    },
  });
};
