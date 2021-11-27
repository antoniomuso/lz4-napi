const { loadBinding } = require('@node-rs/helper')

const {
  compress: _compress,
  uncompress: _uncompress,
  compress_sync,
  uncompress_sync,
} = loadBinding(__dirname, 'lz4-napi', '@antoniomuso/lz4-napi')

module.exports.compress = function compress(data) {
  return _compress(Buffer.isBuffer(data) ? data : Buffer.from(data))
}

module.exports.compressSync = function compressSync(data) {
  return compress_sync(Buffer.isBuffer(data) ? data : Buffer.from(data))
}

module.exports.uncompress = function uncompress(data) {
  return _uncompress(Buffer.isBuffer(data) ? data : Buffer.from(data))
}

module.exports.uncompressSync = function uncompressSync(data) {
  return uncompress_sync(Buffer.isBuffer(data) ? data : Buffer.from(data))
}
