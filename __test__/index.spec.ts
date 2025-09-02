import { readFileSync } from 'fs'
import { Readable, Writable, pipeline } from 'stream'
import { promisify } from 'util'

import test from 'ava'

import {
  compress,
  uncompress,
  compressSync,
  uncompressSync,
  compressFrame,
  decompressFrame,
  compressFrameSync,
  decompressFrameSync,
  EncoderStream,
  DecoderStream,
  createEncoderStream,
  createDecoderStream,
} from '../index.js'

const stringToCompress = 'adewqeqweqwewleekqwoekqwoekqwpoekqwpoekqwpoekqwpoekqwpoekqwpokeeqw'
const dict = readFileSync('__test__/dict.bin')

test('compress should return smaller value', async (t) => {
  const before = Buffer.from(stringToCompress)
  const compressed = await compress(new Uint8Array(before))
  t.true(before.length > compressed.length)
  t.true(compressed.length !== 0)
})

test('compressFrame should return smaller value', async (t) => {
  const before = Buffer.from(stringToCompress)
  const compressed = await compressFrame(new Uint8Array(before))
  t.true(before.length > compressed.length)
  t.true(compressed.length !== 0)
})

test('compress decompress should work', async (t) => {
  const before = Buffer.from(stringToCompress)
  const compressed = await compress(before)
  t.true(before.length > compressed.length)
  const decompressed = await uncompress(compressed)
  t.is(before.toString('utf8'), decompressed.toString('utf8'))
})

test('compress decompress should work with dict ', async (t) => {
  const before = Buffer.from(stringToCompress)
  const compressed = await compress(before, dict)
  t.true(before.length > compressed.length)
  const decompressed = await uncompress(compressed, dict)
  t.is(before.toString('utf8'), decompressed.toString('utf8'))
})

test('compress decompress sync should work', (t) => {
  const before = Buffer.from(stringToCompress)
  const compressed = compressSync(before)
  t.true(before.length > compressed.length)
  const decompressed = uncompressSync(new Uint8Array(compressed))
  t.is(before.toString('utf8'), decompressed.toString('utf8'))
})

test('compress should take all input types', async (t) => {
  const stringBuffer = Buffer.from(stringToCompress)
  await t.notThrowsAsync(compress(stringToCompress))
  await t.notThrowsAsync(compress(new Uint8Array(stringBuffer)))
  await t.notThrowsAsync(compress(new Uint8Array(stringBuffer)))
})

test('uncompress should take all input types', async (t) => {
  const compressedValue = compressSync(stringToCompress)
  await t.notThrowsAsync(uncompress(new Uint8Array(compressedValue)))
  await t.notThrowsAsync(uncompress(new Uint8Array(compressedValue)))
})

test('compress and decompress frame should work', async (t) => {
  const before = Buffer.from(stringToCompress)
  const compressed = await compressFrame(before)
  t.true(before.length > compressed.length)
  const decompressed = await decompressFrame(compressed)
  t.is(before.toString('utf8'), decompressed.toString('utf8'))
})

test('compressFrameSync should return smaller value', (t) => {
  const before = Buffer.from(stringToCompress)
  const compressed = compressFrameSync(before)
  t.true(before.length > compressed.length)
  t.true(compressed.length !== 0)
})

test('compress and decompress frame sync should work', (t) => {
  const before = Buffer.from(stringToCompress)
  const compressed = compressFrameSync(before)
  t.true(before.length > compressed.length)
  const decompressed = decompressFrameSync(compressed)
  t.is(before.toString('utf8'), decompressed.toString('utf8'))
})

test('compressFrameSync should take all input types', (t) => {
  const stringBuffer = Buffer.from(stringToCompress)
  t.notThrows(() => compressFrameSync(stringToCompress))
  t.notThrows(() => compressFrameSync(stringBuffer))
  t.notThrows(() => compressFrameSync(stringBuffer))
})

const pipelineAsync = promisify(pipeline)

// Test data for streaming tests
const streamTestData = [
  'Hello, World!',
  'This is a test of LZ4 streaming compression.',
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
  'The quick brown fox jumps over the lazy dog.',
  '1234567890'.repeat(100), // Larger chunk
  Buffer.from('Binary data test: \x00\x01\x02\x03\x04\x05'),
  'Final chunk of test data.',
]

test('EncoderStream and DecoderStream basic compression', async (t) => {
  const encoder = new EncoderStream()
  const decoder = new DecoderStream()

  let compressed = Buffer.alloc(0)
  let decompressed = Buffer.alloc(0)

  return new Promise<void>((resolve, reject) => {
    // Collect compressed data
    encoder.on('data', (chunk: Buffer) => {
      compressed = Buffer.concat([compressed, chunk])
    })

    encoder.on('end', () => {
      t.true(compressed.length > 0, 'Should produce compressed data')

      // Now decompress
      decoder.on('data', (chunk: Buffer) => {
        decompressed = Buffer.concat([decompressed, chunk])
      })

      decoder.on('end', () => {
        const originalData = streamTestData.join('')
        const decompressedData = decompressed.toString()

        t.is(originalData, decompressedData, 'Data should match after compression/decompression')
        t.true(compressed.length < originalData.length, 'Should achieve compression')
        resolve()
      })

      decoder.on('error', reject)

      // Write compressed data to decoder
      decoder.write(compressed)
      decoder.end()
    })

    encoder.on('error', reject)

    // Write test data to encoder
    streamTestData.forEach((chunk) => encoder.write(chunk))
    encoder.end()
  })
})

test('EncoderStream and DecoderStream pipeline usage', async (t) => {
  const testData = [...streamTestData] // Copy array
  const expectedData = testData.join('')

  const input = new Readable({
    read() {
      if (testData.length > 0) {
        this.push(testData.shift())
      } else {
        this.push(null)
      }
    },
  })

  const encoder = new EncoderStream()
  const decoder = new DecoderStream()

  let result = Buffer.alloc(0)
  const output = new Writable({
    write(chunk: Buffer, encoding: BufferEncoding, callback: (error?: Error | null) => void) {
      result = Buffer.concat([result, chunk])
      callback()
    },
  })

  await pipelineAsync(input, encoder, decoder, output)

  const actualData = result.toString()
  t.is(expectedData, actualData, 'Pipeline should preserve data integrity')
})

test('createEncoderStream and createDecoderStream factory functions', async (t) => {
  const encoder = createEncoderStream()
  const decoder = createDecoderStream()

  return new Promise<void>((resolve, reject) => {
    const testString = 'Factory function test data'
    let compressed = Buffer.alloc(0)
    let decompressed = Buffer.alloc(0)

    encoder.on('data', (chunk: Buffer) => {
      compressed = Buffer.concat([compressed, chunk])
    })

    encoder.on('end', () => {
      decoder.on('data', (chunk: Buffer) => {
        decompressed = Buffer.concat([decompressed, chunk])
      })

      decoder.on('end', () => {
        t.is(testString, decompressed.toString(), 'Factory functions should work correctly')
        resolve()
      })

      decoder.on('error', reject)
      decoder.write(compressed)
      decoder.end()
    })

    encoder.on('error', reject)
    encoder.write(testString)
    encoder.end()
  })
})

test('EncoderStream and DecoderStream large data streaming', async (t) => {
  const largeData = 'A'.repeat(1024 * 1024) // 1MB of data

  return new Promise<void>((resolve, reject) => {
    const encoder = new EncoderStream()
    const decoder = new DecoderStream()

    let compressed = Buffer.alloc(0)
    let decompressed = Buffer.alloc(0)

    encoder.on('data', (chunk: Buffer) => {
      compressed = Buffer.concat([compressed, chunk])
    })

    encoder.on('end', () => {
      t.true(compressed.length < largeData.length, 'Should compress large data effectively')

      decoder.on('data', (chunk: Buffer) => {
        decompressed = Buffer.concat([decompressed, chunk])
      })

      decoder.on('end', () => {
        t.is(largeData, decompressed.toString(), 'Large data should be preserved')
        t.true(compressed.length / largeData.length < 0.1, 'Should achieve good compression ratio')
        resolve()
      })

      decoder.on('error', reject)
      decoder.write(compressed)
      decoder.end()
    })

    encoder.on('error', reject)

    // Write data in chunks
    const chunkSize = 8192
    for (let i = 0; i < largeData.length; i += chunkSize) {
      encoder.write(largeData.slice(i, i + chunkSize))
    }
    encoder.end()
  })
})

test('DecoderStream error handling for invalid data', async (t) => {
  const decoder = new DecoderStream()

  return new Promise<void>((resolve) => {
    decoder.on('error', (error: Error) => {
      t.true(
        error.message.includes('WrongMagicNumber') || error.message.includes('Invalid'),
        'Should emit proper error for invalid data',
      )
      resolve()
    })

    decoder.on('end', () => {
      t.fail('Stream should not end normally with invalid data')
      resolve()
    })

    // Write invalid LZ4 data
    decoder.write(Buffer.from('invalid lz4 data'))
    decoder.end()
  })
})

test('EncoderStream and DecoderStream isFinished method', async (t) => {
  const encoder = new EncoderStream()
  const decoder = new DecoderStream()

  t.false(encoder.isFinished(), 'Encoder should not be finished initially')
  t.false(decoder.isFinished(), 'Decoder should not be finished initially')

  return new Promise<void>((resolve, reject) => {
    const testData = 'Test data for isFinished method'
    let compressed = Buffer.alloc(0)

    encoder.on('data', (chunk: Buffer) => {
      compressed = Buffer.concat([compressed, chunk])
    })

    encoder.on('end', () => {
      decoder.on('data', () => {
        // Data received
      })

      decoder.on('end', () => {
        t.true(encoder.isFinished(), 'Encoder should be finished after end')
        t.true(decoder.isFinished(), 'Decoder should be finished after end')
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
})

test('decompressFrameSync should take all input types', (t) => {
  const compressedValue = compressFrameSync(stringToCompress)
  t.notThrows(() => decompressFrameSync(compressedValue))
  t.notThrows(() => decompressFrameSync(compressedValue))
})

test('frame sync and async should produce compatible output', async (t) => {
  const before = Buffer.from(stringToCompress)
  const compressedSync = compressFrameSync(before)
  const compressedAsync = await compressFrame(new Uint8Array(before))

  // Both async and sync decompression should work on sync compressed data
  const decompressedSync = decompressFrameSync(compressedSync)
  const decompressedAsync = await decompressFrame(new Uint8Array(compressedSync))
  t.is(before.toString('utf8'), decompressedSync.toString('utf8'))
  t.is(before.toString('utf8'), decompressedAsync.toString('utf8'))

  // Both async and sync decompression should work on async compressed data
  const decompressedSync2 = decompressFrameSync(compressedAsync)
  const decompressedAsync2 = await decompressFrame(new Uint8Array(compressedAsync))
  t.is(before.toString('utf8'), decompressedSync2.toString('utf8'))
  t.is(before.toString('utf8'), decompressedAsync2.toString('utf8'))
})
