const { Transform } = require('stream')

const nativeBinding = require('../nativeBindings')

const { Lz4DecoderStream } = nativeBinding

/**
 * LZ4 Decoder Transform Stream
 *
 * A Node.js Transform stream that decompresses LZ4 data.
 * Compatible with node-lz4's DecoderStream interface.
 */
class DecoderStream extends Transform {
  constructor(options = {}) {
    super(options)

    // Create the Rust decoder instance
    this._decoder = new Lz4DecoderStream()
    this._finished = false
  }

  _transform(chunk, encoding, callback) {
    try {
      if (!Buffer.isBuffer(chunk)) {
        chunk = Buffer.from(chunk, encoding)
      }

      // Write data to the Rust decoder
      const decompressed = this._decoder.write(chunk)

      // Push decompressed data if any
      if (decompressed && decompressed.length > 0) {
        this.push(decompressed)
      }

      callback()
    } catch (error) {
      callback(error)
    }
  }

  _flush(callback) {
    try {
      if (!this._finished) {
        // Finish the decompression and get any remaining data
        const finalData = this._decoder.finish()
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
   * Check if the decoder has finished processing
   * @returns {boolean}
   */
  isFinished() {
    return this._decoder.isFinished()
  }
}

module.exports = DecoderStream
