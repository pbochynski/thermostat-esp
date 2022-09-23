module.exports = function(config) {
  config.output.publicPath = '/thermostat-esp/';
  config.output.filename = '[name].js';
  config.output.chunkFilename = '[name].chunk.js';
};