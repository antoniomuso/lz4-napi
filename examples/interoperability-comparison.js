const { EncoderStream: NapiEncoderStream, DecoderStream: NapiDecoderStream } = require('../index')
const { createEncoderStream: createNodeEncoderStream, createDecoderStream: createNodeDecoderStream } = require('lz4')
const { pipeline } = require('stream')
const { promisify } = require('util')
const { Readable, Writable } = require('stream')

const pipelineAsync = promisify(pipeline)

/**
 * Test data generator
 */
function generateTestData() {
  return {
    small: 'Hello, World! This is a small test string for LZ4 compression.',
    medium: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(100),
    large: 'This is a larger test string that should compress well with LZ4. '.repeat(100000),
    binary: Buffer.from([0x00, 0x01, 0x02, 0x03, 0xff, 0xfe, 0xfd, 0xfc]).toString('binary').repeat(500),
    repetitive: 'AAAAAAAAAA'.repeat(1000),
    random: Array.from({ length: 5000 }, () => String.fromCharCode(Math.floor(Math.random() * 256))).join(''),
  }
}

/**
 * Helper function to compress data using a stream
 */
async function compressWithStream(data, encoderStream) {
  return new Promise((resolve, reject) => {
    let compressed = Buffer.alloc(0)

    encoderStream.on('data', (chunk) => {
      compressed = Buffer.concat([compressed, chunk])
    })

    encoderStream.on('end', () => resolve(compressed))
    encoderStream.on('error', reject)

    encoderStream.write(data)
    encoderStream.end()
  })
}

/**
 * Helper function to decompress data using a stream
 */
async function decompressWithStream(compressedData, decoderStream) {
  return new Promise((resolve, reject) => {
    let decompressed = Buffer.alloc(0)

    decoderStream.on('data', (chunk) => {
      decompressed = Buffer.concat([decompressed, chunk])
    })

    decoderStream.on('end', () => resolve(decompressed))
    decoderStream.on('error', reject)

    decoderStream.write(compressedData)
    decoderStream.end()
  })
}

/**
 * Test compression with one library and decompression with another
 */
async function testCrossCompatibility(testName, originalData, compressEncoder, decompressDecoder) {
  try {
    console.log(`\n--- ${testName} ---`)
    console.log(`Original size: ${originalData.length} bytes`)

    // Compress with first library
    const compressed = await compressWithStream(originalData, compressEncoder)
    console.log(`Compressed size: ${compressed.length} bytes`)
    console.log(`Compression ratio: ${((compressed.length / originalData.length) * 100).toFixed(2)}%`)

    // Decompress with second library
    const decompressed = await decompressWithStream(compressed, decompressDecoder)
    const decompressedStr = decompressed.toString()

    // Verify data integrity
    const matches = originalData === decompressedStr
    console.log(`Data integrity: ${matches ? '✅ PASS' : '❌ FAIL'}`)

    if (!matches) {
      console.log(`Expected length: ${originalData.length}, Got: ${decompressedStr.length}`)
      console.log(`First 100 chars expected: ${originalData.substring(0, 100)}`)
      console.log(`First 100 chars got: ${decompressedStr.substring(0, 100)}`)
    }

    return matches
  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`)
    return false
  }
}

/**
 * Test pipeline compatibility
 */
async function testPipelineCompatibility(testName, data, encoder, decoder) {
  try {
    console.log(`\n--- Pipeline Test: ${testName} ---`)

    const input = new Readable({
      read() {
        this.push(data)
        this.push(null)
      },
    })

    let result = ''
    const output = new Writable({
      write(chunk, encoding, callback) {
        result += chunk.toString()
        callback()
      },
    })

    await pipelineAsync(input, encoder, decoder, output)

    const matches = data === result
    console.log(`Pipeline integrity: ${matches ? '✅ PASS' : '❌ FAIL'}`)

    return matches
  } catch (error) {
    console.log(`❌ Pipeline ERROR: ${error.message}`)
    return false
  }
}

/**
 * Performance comparison
 */
async function performanceComparison(data) {
  console.log('\n=== Performance Comparison ===')

  const tests = [
    {
      name: 'lz4-napi encode/decode',
      encode: () => new NapiEncoderStream(),
      decode: () => new NapiDecoderStream(),
    },
    {
      name: 'node-lz4 encode/decode',
      encode: () => createNodeEncoderStream(),
      decode: () => createNodeDecoderStream(),
    },
  ]

  for (const test of tests) {
    const startTime = process.hrtime.bigint()

    try {
      const encoder = test.encode()
      const compressed = await compressWithStream(data, encoder)

      const decoder = test.decode()
      const decompressed = await decompressWithStream(compressed, decoder)

      const endTime = process.hrtime.bigint()
      const duration = Number(endTime - startTime) / 1000000 // Convert to milliseconds

      console.log(`${test.name}: ${duration.toFixed(2)}ms (${compressed.length} bytes compressed)`)
    } catch (error) {
      console.log(`${test.name}: ERROR - ${error.message}`)
    }
  }
}

/**
 * Main test runner
 */
async function runInteroperabilityTests() {
  console.log('🔄 LZ4 Libraries Interoperability Test\n')
  console.log('Testing cross-compatibility between lz4-napi and node-lz4 stream implementations...')

  const testData = generateTestData()
  const results = []

  // Test all combinations for each data type
  for (const [dataType, data] of Object.entries(testData)) {
    console.log(`\n🧪 Testing with ${dataType} data (${data.length} bytes)`)

    // lz4-napi compress → node-lz4 decompress
    const test1 = await testCrossCompatibility(
      `${dataType}: lz4-napi → node-lz4`,
      data,
      new NapiEncoderStream(),
      createNodeDecoderStream(),
    )
    results.push({ test: `${dataType}: lz4-napi → node-lz4`, passed: test1 })

    // node-lz4 compress → lz4-napi decompress
    const test2 = await testCrossCompatibility(
      `${dataType}: node-lz4 → lz4-napi`,
      data,
      createNodeEncoderStream(),
      new NapiDecoderStream(),
    )
    results.push({ test: `${dataType}: node-lz4 → lz4-napi`, passed: test2 })

    // Pipeline tests
    const pipeline1 = await testPipelineCompatibility(
      `${dataType}: lz4-napi pipeline`,
      data,
      new NapiEncoderStream(),
      new NapiDecoderStream(),
    )
    results.push({ test: `${dataType}: lz4-napi pipeline`, passed: pipeline1 })

    const pipeline2 = await testPipelineCompatibility(
      `${dataType}: node-lz4 pipeline`,
      data,
      createNodeEncoderStream(),
      createNodeDecoderStream(),
    )
    results.push({ test: `${dataType}: node-lz4 pipeline`, passed: pipeline2 })

    // Cross-library pipeline test
    const crossPipeline = await testPipelineCompatibility(
      `${dataType}: cross-library pipeline (napi→node)`,
      data,
      new NapiEncoderStream(),
      createNodeDecoderStream(),
    )
    results.push({ test: `${dataType}: cross-library pipeline`, passed: crossPipeline })
  }

  // Performance comparison with medium data
  await performanceComparison(testData.large)

  // Summary
  console.log('\n📊 Test Results Summary')
  console.log('='.repeat(50))

  const passed = results.filter((r) => r.passed).length
  const total = results.length

  results.forEach((result) => {
    console.log(`${result.passed ? '✅' : '❌'} ${result.test}`)
  })

  console.log('='.repeat(50))
  console.log(`Overall: ${passed}/${total} tests passed (${((passed / total) * 100).toFixed(1)}%)`)

  if (passed === total) {
    console.log('\n🎉 All interoperability tests passed! The libraries are fully compatible.')
  } else {
    console.log('\n⚠️  Some tests failed. There may be compatibility issues between the libraries.')
  }

  return passed === total
}

// Export for use in other modules
module.exports = {
  runInteroperabilityTests,
  testCrossCompatibility,
  testPipelineCompatibility,
  performanceComparison,
  generateTestData,
}

// Run tests if this file is executed directly
if (require.main === module) {
  runInteroperabilityTests()
    .then((success) => {
      process.exit(success ? 0 : 1)
    })
    .catch((error) => {
      console.error('❌ Test runner failed:', error)
      process.exit(1)
    })
}
