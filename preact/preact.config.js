/**
 * @param {import('preact-cli').Config} config - Original webpack config
 * @param {import('preact-cli').Env} env - Current environment info
 * @param {import('preact-cli').Helpers} helpers - Object with useful helpers for working with the webpack config
 */

export default (config, env, helpers) => {
  config.output.filename = '[name].js';
  config.output.chunkFilename = '[name].chunk.js';
  const babelEsmPlugin = helpers.getPluginsByName(config, 'BabelEsmPlugin')[0];
  const miniExtractPlugin = helpers.getPluginsByName(config, 'MiniCssExtractPlugin')[0];
  if (babelEsmPlugin) {
    babelEsmPlugin.plugin.options_.chunkFilename = '[name].chunk.esm.js';
    babelEsmPlugin.plugin.options_.filename = '[name].esm.js';
  }
  if (miniExtractPlugin) {
    miniExtractPlugin.plugin.options.chunkFilename = '[name].chunk.css';
    miniExtractPlugin.plugin.options.filename = '[name].css';
  }
};