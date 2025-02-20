/**
 * Karma configuration file.
 * This configuration sets up webpack with source maps and code instrumentation
 * (using istanbul-instrumenter-loader) to generate coverage reports.
 *
 * It uses three types of coverage reporters:
 *  - HTML: writes a detailed report to disk.
 *  - lcov: for CI tools.
 *  - text-summary: prints a coverage summary in the console.
 *
 * Note: If tests are failing, you might see an initial “Unknown%” summary followed
 * by the actual numbers. Fixing test failures should result in a single, correct summary.
 */
const path = require('path');
const webpackConfig = require('./webpack.config');
const TerserWebpackPlugin = require('terser-webpack-plugin');
const { cache } = require('webpack');
const { split } = require('postcss/lib/list');

module.exports = function (config) {
  // Create a webpack configuration for tests.
  const testWebpackConfig = {
    mode: 'development',
    devtool: 'inline-source-map',
    resolve: {
      extensions: ['.ts', '.js', '.json'],
      cache: true,
    },
    module: {
      rules: [
        // Use the main webpack rules.
        ...webpackConfig.module.rules,
        // Instrument TypeScript files (excluding tests) for coverage.
        {
          test: /\.(js|ts)$/,
          include: path.resolve(__dirname, 'src'),
          exclude: [/\.spec\.ts$/],
          enforce: 'post',
          loader: 'coverage-istanbul-loader',
          options: {
            esModules: true,
            cacheDirectory: true
          }
        }
      ]
    },
    // Remove plugins (like Terser) that could interfere with testing.
    plugins: webpackConfig.plugins.filter(plugin =>
      !(plugin instanceof TerserWebpackPlugin)
    ),
    // Add cache confirmation
    cache: {
      type: 'memory'
    },
    // Optimization performance settings
    optimization: {
      removeAvailableModules: false,
      removeEmptyChunks: false,
      splitChunks: false,
    },
  };

  config.set({
    basePath: '',
    frameworks: ['jasmine', 'webpack'],
    files: [
      // Include all test spec files.
      { pattern: 'src/plugins/**/tests/**/*.spec.ts', type: 'js' }
    ],
    preprocessors: {
      // Preprocess tests with webpack and sourcemaps.
      'src/plugins/**/tests/**/*.spec.ts': ['webpack', 'sourcemap']
    },
    webpack: testWebpackConfig,
    webpackMiddleware: {
      stats: 'minimal',
      watchOptions: {
        ignored: /node_modules/
      }
    },
    // Use both progress and coverage reporters.
    reporters: ['progress', 'coverage'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    browsers: ['ChromeHeadless'],
    // Increase timeouts
    browserDisconnectTimeout: 10000,
    browserDisconnectTolerance: 3,
    browserNoActivityTimeout: 60000,
    captureTimeout: 60000,
    // Enable this if you need to keep tests running
    singleRun: true,
    concurrency: Infinity,
    coverageReporter: {
      // Include all sources to ensure full coverage collection.
      includeAllSources: true,
      // Output directory for coverage reports.
      dir: 'coverage/',
      reporters: [
        { type: 'html', subdir: 'html' },
        // { type: 'lcov', subdir: 'lcov' },
        { type: 'text-summary' }
      ],
      // Optional watermarks for visual reporting.
      watermarks: {
        statements: [90, 100],
        functions: [90, 100],
        branches: [90, 100],
        lines: [90, 100]
      }
    }
  });
};
