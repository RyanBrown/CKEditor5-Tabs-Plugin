const path = require('path');

module.exports = async function (config) {
  // Import webpack config dynamically
  const webpackConfig = (await import('./webpack.config.js')).default;
  const TerserWebpackPlugin = (await import('terser-webpack-plugin')).default;

  const testWebpackConfig = {
    mode: 'development',
    devtool: 'inline-source-map',
    resolve: {
      extensions: ['.ts', '.js', '.json']
    },
    module: {
      rules: [
        ...webpackConfig.module.rules,
        {
          test: /\.ts$/,
          include: path.resolve(__dirname, 'src'),
          exclude: [/\.spec\.ts$/],
          enforce: 'post',
          loader: 'coverage-istanbul-loader',
          options: { esModules: true }
        }
      ]
    },
    plugins: webpackConfig.plugins.filter(
      plugin => !(plugin instanceof TerserWebpackPlugin)
    )
  };

  config.set({
    basePath: '',
    frameworks: ['jasmine'],
    files: [
      { pattern: 'src/plugins/**/tests/**/*.spec.ts', type: 'module' }
    ],
    preprocessors: {
      'src/plugins/**/tests/**/*.spec.ts': ['webpack', 'sourcemap']
    },
    webpack: testWebpackConfig,
    webpackMiddleware: { stats: 'minimal' },
    reporters: ['progress', 'coverage'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    browsers: ['ChromeHeadless'],
    singleRun: true,
    concurrency: Infinity,
    plugins: [
      'karma-jasmine',
      'karma-chrome-launcher',
      'karma-webpack',
      'karma-sourcemap-loader',
      'karma-coverage'
    ],
    coverageReporter: {
      includeAllSources: true,
      dir: 'coverage/',
      reporters: [
        { type: 'html', subdir: 'html' },
        { type: 'lcov', subdir: 'lcov' },
        { type: 'text-summary' }
      ],
      watermarks: {
        statements: [90, 100],
        functions: [90, 100],
        branches: [90, 100],
        lines: [90, 100]
      }
    }
  });
};