// Re-export all native bindings
module.exports = require('./nativeBindings')

// Import and add Transform stream wrappers
const { EncoderStream, DecoderStream, createEncoderStream, createDecoderStream } = require('./lib')

// Export Node.js Transform streams (high-level API)
module.exports.EncoderStream = EncoderStream
module.exports.DecoderStream = DecoderStream
module.exports.createEncoderStream = createEncoderStream
module.exports.createDecoderStream = createDecoderStream
