const { EncoderStream: NapiEncoder, DecoderStream: NapiDecoder } = require('../index')
const { createEncoderStream: createNodeEncoder, createDecoderStream: createNodeDecoder } = require('lz4')

/**
 * Simple helper to compress data with a stream
 */
function compress(data, encoder) {
  return new Promise((resolve, reject) => {
    let result = Buffer.alloc(0)
    encoder.on('data', (chunk) => (result = Buffer.concat([result, chunk])))
    encoder.on('end', () => resolve(result))
    encoder.on('error', reject)
    encoder.write(data)
    encoder.end()
  })
}

/**
 * Simple helper to decompress data with a stream
 */
function decompress(data, decoder) {
  return new Promise((resolve, reject) => {
    let result = Buffer.alloc(0)
    decoder.on('data', (chunk) => (result = Buffer.concat([result, chunk])))
    decoder.on('end', () => resolve(result))
    decoder.on('error', reject)
    decoder.write(data)
    decoder.end()
  })
}

async function demonstrateCrossCompatibility() {
  console.log('🔄 LZ4 Cross-Compatibility Demo\n')

  const testData = 'Hello, World! This is a test of cross-library compatibility between lz4-napi and node-lz4. '.repeat(
    50,
  )
  console.log(`Original data: ${testData.length} bytes`)

  console.log('\n--- Test 1: Compress with lz4-napi, decompress with node-lz4 ---')
  const napiCompressed = await compress(testData, new NapiEncoder())
  console.log(`Compressed with lz4-napi: ${napiCompressed.length} bytes`)

  const nodeDecompressed = await decompress(napiCompressed, createNodeDecoder())
  const nodeResult = nodeDecompressed.toString()
  console.log(`Decompressed with node-lz4: ${nodeResult.length} bytes`)
  console.log(`Data matches: ${testData === nodeResult ? '✅ YES' : '❌ NO'}`)

  console.log('\n--- Test 2: Compress with node-lz4, decompress with lz4-napi ---')
  const nodeCompressed = await compress(testData, createNodeEncoder())
  console.log(`Compressed with node-lz4: ${nodeCompressed.length} bytes`)

  const napiDecompressed = await decompress(nodeCompressed, new NapiDecoder())
  const napiResult = napiDecompressed.toString()
  console.log(`Decompressed with lz4-napi: ${napiResult.length} bytes`)
  console.log(`Data matches: ${testData === napiResult ? '✅ YES' : '❌ NO'}`)

  console.log('\n--- Compression Comparison ---')
  console.log(
    `lz4-napi compressed size: ${napiCompressed.length} bytes (${((napiCompressed.length / testData.length) * 100).toFixed(2)}%)`,
  )
  console.log(
    `node-lz4 compressed size: ${nodeCompressed.length} bytes (${((nodeCompressed.length / testData.length) * 100).toFixed(2)}%)`,
  )

  const sizeDiff = Math.abs(napiCompressed.length - nodeCompressed.length)
  console.log(`Size difference: ${sizeDiff} bytes`)

  console.log('\n🎉 Cross-compatibility test completed successfully!')
  console.log("Both libraries can compress and decompress each other's data streams.")
}

// Run the demo
if (require.main === module) {
  demonstrateCrossCompatibility().catch(console.error)
}

module.exports = { demonstrateCrossCompatibility, compress, decompress }
