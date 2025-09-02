const { Transform } = require('stream')

const nativeBinding = require('../nativeBindings')

const { Lz4EncoderStream } = nativeBinding

/**
 * LZ4 Encoder Transform Stream
 *
 * A Node.js Transform stream that compresses data using LZ4.
 * Compatible with node-lz4's EncoderStream interface.
 */
class EncoderStream extends Transform {
  constructor(options = {}) {
    super(options)

    // Create the Rust encoder instance
    this._encoder = new Lz4EncoderStream()
    this._finished = false
    this._headerWritten = false
  }

  _transform(chunk, encoding, callback) {
    try {
      if (!Buffer.isBuffer(chunk)) {
        chunk = Buffer.from(chunk, encoding)
      }

      // Write data to the Rust encoder and get compressed output
      const compressed = this._encoder.write(chunk)

      // Push compressed data if any
      if (compressed && compressed.length > 0) {
        this.push(compressed)
      }

      callback()
    } catch (error) {
      callback(error)
    }
  }

  _flush(callback) {
    try {
      if (!this._finished) {
        // Finish the compression and get the final compressed data
        const finalData = this._encoder.finish()
        this._finished = true

        if (finalData && finalData.length > 0) {
          this.push(finalData)
        }
      }

      callback()
    } catch (error) {
      callback(error)
    }
  }

  /**
   * Check if the encoder has finished processing
   * @returns {boolean}
   */
  isFinished() {
    return this._encoder.isFinished()
  }
}

module.exports = EncoderStream
