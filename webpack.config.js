'use strict';

/* eslint-env node */

// Import necessary modules using ES module syntax.
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import webpack from 'webpack';
import { styles, bundler } from '@ckeditor/ckeditor5-dev-utils';
import { CKEditorTranslationsPlugin } from '@ckeditor/ckeditor5-dev-translations';
import TerserWebpackPlugin from 'terser-webpack-plugin';

// Use createRequire to enable CommonJS require in an ES module.
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Get __filename and __dirname equivalents.
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Export the webpack configuration using ES module export syntax.
export default {
    // Enable source maps for debugging.
    devtool: 'source-map',
    performance: { hints: false },

    // Define the entry point for your CKEditor build.
    entry: path.resolve(__dirname, 'src', 'ckeditor.ts'),

    // Configure the output bundle.
    output: {
        // The name under which the editor will be exported.
        library: 'CKEditor',
        // Output directory.
        path: path.resolve(__dirname, 'build'),
        // Output filename.
        filename: 'ckeditor.js',
        // UMD format for module compatibility.
        libraryTarget: 'umd',
        // Export the default export.
        libraryExport: 'default',
    },

    // Optimization settings for minimizing the bundle.
    optimization: {
        minimizer: [
            new TerserWebpackPlugin({
                terserOptions: {
                    output: {
                        // Preserve CKEditor 5 license comments.
                        comments: /^!/,
                    },
                },
                extractComments: false,
            }),
        ],
    },

    // Define plugins.
    plugins: [
        new CKEditorTranslationsPlugin({
            // UI language. Language codes follow the ISO 639-1 format.
            // When changing the built-in language, remember to also update it in src/ckeditor.ts.
            language: 'en',
            additionalLanguages: 'all',
            outputDirectory: "src/assets/translations",
            translationsOutputFile: "build/translations.json",
        }),
        new webpack.BannerPlugin({
            banner: bundler.getLicenseBanner(),
            raw: true,
        }),
    ],

    // Resolve file extensions.
    resolve: {
        extensions: ['.ts', '.js', '.css', '.scss'],
    },

    // Define module rules.
    module: {
        rules: [
            {
                test: /\.svg$/,
                use: ['raw-loader']
            },
            {
                test: /\.ts$/,
                use: 'ts-loader',
                exclude: /node_modules/
            },
            {
                test: /\.css$/,
                use: [
                    {
                        loader: 'style-loader',
                        options: {
                            // Use 'injectType' with 'singletonStyleTag' instead of the deprecated 'singleton' option.
                            injectType: 'singletonStyleTag',
                            attributes: {
                                'data-cke': true
                            }
                        }
                    },
                    {
                        loader: 'css-loader',
                        options: {
                            importLoaders: 1
                        }
                    },
                    {
                        loader: 'postcss-loader',
                        options: {
                            // Wrap the configuration in 'postcssOptions' to meet the new API schema.
                            postcssOptions: styles.getPostCssConfig({
                                themeImporter: {
                                    // Resolve the theme path using require.resolve.
                                    themePath: require.resolve('@ckeditor/ckeditor5-theme-lark')
                                },
                                minify: true
                            })
                        }
                    }
                ]
            },
            {
                test: /\.scss$/,
                use: [
                    'style-loader',
                    'css-loader',
                    'sass-loader'
                ]
            },
        ],
    },
};
