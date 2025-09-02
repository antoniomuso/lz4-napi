const EncoderStream = require('./encoder_stream')
const DecoderStream = require('./decoder_stream')

function createEncoderStream(options) {
  return new EncoderStream(options)
}

function createDecoderStream(options) {
  return new DecoderStream(options)
}

module.exports = {
  EncoderStream,
  DecoderStream,
  createEncoderStream,
  createDecoderStream,
}
