const { loadBinding } = require('@node-rs/helper')

/**
 * __dirname means load native addon from current dir
 * 'package-template' means native addon name is `package-template`
 * the first arguments was decided by `napi.name` field in `package.json`
 * the second arguments was decided by `name` field in `package.json`
 * loadBinding helper will load `package-template.[PLATFORM].node` from `__dirname` first
 * If failed to load addon, it will fallback to load from `@napi-rs/package-template-[PLATFORM]`
 */
const {
  compress: _compress,
  uncompress: _uncompress,
  compress_sync,
  uncompress_sync,
} = loadBinding(__dirname, 'package-template', '@napi-rs/package-template')

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
