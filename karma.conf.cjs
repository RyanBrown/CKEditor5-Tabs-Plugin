const path = require('path');

module.exports = async function (config) {
  // Import webpack config dynamically
  const webpackConfig = (await import('./webpack.config.js')).default;
  const TerserWebpackPlugin = (await import('terser-webpack-plugin')).default;

  const testWebpackConfig = {
    mode: 'development',
    // Use eval for faster source maps in test
    devtool: 'eval',
    resolve: {
      extensions: ['.ts', '.js', '.json'],
      // Add cache for faster resolution
      cache: true,
      // Restrict lookup to direct dependencies
      modules: ['node_modules']
    },
    module: {
      rules: [
        ...webpackConfig.module.rules,
        {
          test: /\.ts$/,
          include: path.resolve(__dirname, 'src'),
          exclude: [/\.spec\.ts$/, /node_modules/],
          enforce: 'post',
          use: {
            loader: 'coverage-istanbul-loader',
            options: {
              esModules: true,
              // Cache the transformed files
              cacheDirectory: true
            }
          }
        }
      ]
    },
    plugins: webpackConfig.plugins.filter(
      plugin => !(plugin instanceof TerserWebpackPlugin)
    ),
    // Add cache configuration
    cache: {
      type: 'memory'
    },
    // Optimize performance settings
    optimization: {
      removeAvailableModules: false,
      removeEmptyChunks: false,
      splitChunks: false,
    }
  };

  config.set({
    basePath: '',
    frameworks: ['jasmine', 'webpack'],
    files: [
      { pattern: 'src/plugins/**/tests/**/*.spec.ts', type: 'module' }
    ],
    preprocessors: {
      'src/plugins/**/tests/**/*.spec.ts': ['webpack', 'sourcemap']
    },
    webpack: testWebpackConfig,
    webpackMiddleware: {
      // Turn off webpack build output
      stats: 'errors-only',
      // Increase performance with these settings
      watchOptions: {
        ignored: /node_modules/
      }
    },
    // Reduce console output
    reporters: ['dots', 'coverage'],
    // Reduce logging
    logLevel: config.LOG_ERROR,
    browsers: ['ChromeHeadless'],
    // Increase timeouts
    browserDisconnectTimeout: 10000,
    browserDisconnectTolerance: 3,
    browserNoActivityTimeout: 60000,
    captureTimeout: 60000,
    // Enable this if you need to keep tests running
    singleRun: true,
    // Limit parallel tests
    concurrency: 1,
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