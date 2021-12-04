import test from 'ava'

import { compress, uncompress, compressSync, uncompressSync } from '../index.js'

const stringToCompress = 'adewqeqweqwewleekqwoekqwoekqwpoekqwpoekqwpoekqwpoekqwpoekqwpokeeqw'

test('compress should return smaller value', async (t) => {
  const before = Buffer.from(stringToCompress)
  const compressed = await compress(before)
  t.true(before.length > compressed.length)
})

test('compress decompress should work', async (t) => {
  const before = Buffer.from(stringToCompress)
  const compressed = await compress(before)
  t.true(before.length > compressed.length)
  const decompressed = await uncompress(compressed)
  t.is(before.toString('utf8'), decompressed.toString('utf8'))
})

test('compress decompress sync should work', (t) => {
  const before = Buffer.from(stringToCompress)
  const compressed = compressSync(before)
  t.true(before.length > compressed.length)
  const decompressed = uncompressSync(compressed)
  t.is(before.toString('utf8'), decompressed.toString('utf8'))
})

test('should throw a promise error if data is not compressed', async (t) => {
  await t.throwsAsync(uncompress(stringToCompress))
})

test('should throw a TypeError if data is not a String | ArrayBuffer | Buffer | Uint8Array', (t) => {
  t.throws(() => compress({ hello: 'msts' } as unknown as string))
})

test('compress should take all input types', async (t) => {
  const outArr = []
  outArr.push(await compress(stringToCompress))
  outArr.push(await compress(Buffer.from(stringToCompress)))
  outArr.push(await compress(new Uint8Array(Buffer.from(stringToCompress))))

  t.is(new Set(outArr.map((buff) => buff.toString())).size, 1)
})

test('uncompress should take all input types', async (t) => {
  const compressedValue = compressSync(stringToCompress)
  const outArr = []
  outArr.push(await uncompress(compressedValue))
  outArr.push(await uncompress(Buffer.from(compressedValue)))
  outArr.push(await uncompress(new Uint8Array(Buffer.from(compressedValue))))

  t.is(new Set(outArr.map((buff) => buff.toString())).size, 1)
})
