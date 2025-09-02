const { EncoderStream, DecoderStream, createEncoderStream, createDecoderStream } = require('../index')
const { createReadStream, createWriteStream } = require('fs')
const { pipeline } = require('stream')
const { promisify } = require('util')

const pipelineAsync = promisify(pipeline)

async function basicStreamingExample() {
  console.log('=== Basic Streaming Example ===')

  const encoder = new EncoderStream()
  const decoder = new DecoderStream()

  // Test data
  const testData = 'Hello, World! This is a test of LZ4 streaming compression.'

  return new Promise((resolve, reject) => {
    let compressed = Buffer.alloc(0)
    let decompressed = Buffer.alloc(0)

    // Collect compressed data
    encoder.on('data', (chunk) => {
      compressed = Buffer.concat([compressed, chunk])
    })

    encoder.on('end', () => {
      console.log(`Original: ${testData.length} bytes`)
      console.log(`Compressed: ${compressed.length} bytes`)
      console.log(`Compression ratio: ${((compressed.length / testData.length) * 100).toFixed(2)}%`)

      // Now decompress
      decoder.on('data', (chunk) => {
        decompressed = Buffer.concat([decompressed, chunk])
      })

      decoder.on('end', () => {
        const result = decompressed.toString()
        console.log(`Decompressed: ${result}`)
        console.log(`Match: ${testData === result ? '✅' : '❌'}`)
        resolve()
      })

      decoder.on('error', reject)
      decoder.write(compressed)
      decoder.end()
    })

    encoder.on('error', reject)
    encoder.write(testData)
    encoder.end()
  })
}

async function pipelineExample() {
  console.log('\n=== Pipeline Example ===')

  const { Readable, Writable } = require('stream')

  // Create a readable stream with test data
  const chunks = [
    'Chunk 1: Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    'Chunk 2: Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    'Chunk 3: Ut enim ad minim veniam, quis nostrud exercitation ullamco.',
    'Chunk 4: Duis aute irure dolor in reprehenderit in voluptate velit esse.',
    'Chunk 5: Excepteur sint occaecat cupidatat non proident, sunt in culpa.',
  ]

  const input = new Readable({
    read() {
      if (chunks.length > 0) {
        this.push(chunks.shift())
      } else {
        this.push(null)
      }
    },
  })

  const encoder = createEncoderStream()
  const decoder = createDecoderStream()

  let result = ''
  const output = new Writable({
    write(chunk, encoding, callback) {
      result += chunk.toString()
      callback()
    },
  })

  await pipelineAsync(input, encoder, decoder, output)

  console.log('Pipeline result:')
  console.log(result)
  console.log('✅ Pipeline completed successfully')
}

async function fileCompressionExample() {
  console.log('\n=== File Compression Example ===')

  // Create a test file
  const testContent = 'This is test content for file compression.\n'.repeat(1000)
  require('fs').writeFileSync('/tmp/test-input.txt', testContent)

  try {
    // Compress file
    await pipelineAsync(
      createReadStream('/tmp/test-input.txt'),
      new EncoderStream(),
      createWriteStream('/tmp/test-compressed.lz4'),
    )

    // Decompress file
    await pipelineAsync(
      createReadStream('/tmp/test-compressed.lz4'),
      new DecoderStream(),
      createWriteStream('/tmp/test-output.txt'),
    )

    // Compare files
    const originalSize = require('fs').statSync('/tmp/test-input.txt').size
    const compressedSize = require('fs').statSync('/tmp/test-compressed.lz4').size
    const decompressedContent = require('fs').readFileSync('/tmp/test-output.txt', 'utf8')

    console.log(`Original file size: ${originalSize} bytes`)
    console.log(`Compressed file size: ${compressedSize} bytes`)
    console.log(`Compression ratio: ${((compressedSize / originalSize) * 100).toFixed(2)}%`)
    console.log(`Content matches: ${testContent === decompressedContent ? '✅' : '❌'}`)

    // Cleanup
    require('fs').unlinkSync('/tmp/test-input.txt')
    require('fs').unlinkSync('/tmp/test-compressed.lz4')
    require('fs').unlinkSync('/tmp/test-output.txt')
  } catch (error) {
    console.error('File compression example failed:', error.message)
  }
}

async function errorHandlingExample() {
  console.log('\n=== Error Handling Example ===')

  const decoder = new DecoderStream()

  decoder.on('error', (error) => {
    console.log(`✅ Caught expected error: ${error.message}`)
  })

  decoder.on('end', () => {
    console.log('❌ Stream ended unexpectedly')
  })

  // Write invalid LZ4 data
  decoder.write(Buffer.from('This is not valid LZ4 data'))
  decoder.end()

  // Wait a bit for the error to be emitted
  await new Promise((resolve) => setTimeout(resolve, 100))
}

async function runExamples() {
  console.log('LZ4-NAPI Streaming Examples\n')

  try {
    await basicStreamingExample()
    await pipelineExample()
    await fileCompressionExample()
    await errorHandlingExample()

    console.log('\n🎉 All examples completed successfully!')
  } catch (error) {
    console.error('❌ Example failed:', error)
    process.exit(1)
  }
}

// Run examples if this file is executed directly
if (require.main === module) {
  runExamples()
}

module.exports = {
  basicStreamingExample,
  pipelineExample,
  fileCompressionExample,
  errorHandlingExample,
  runExamples,
}
