import { readFileSync } from 'fs'

import test from 'ava'

import { compress, uncompress, compressSync, uncompressSync } from '../index.js'

const stringToCompress = 'adewqeqweqwewleekqwoekqwoekqwpoekqwpoekqwpoekqwpoekqwpoekqwpokeeqw'
const dict = readFileSync('__test__/dict.bin')

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
  const decompressed = uncompressSync(compressed)
  t.is(before.toString('utf8'), decompressed.toString('utf8'))
})

test('compress should take all input types', async (t) => {
  const stringBuffer = Buffer.from(stringToCompress)
  await t.notThrowsAsync(compress(stringToCompress))
  await t.notThrowsAsync(compress(stringBuffer))
  await t.notThrowsAsync(compress(new Uint8Array(stringBuffer)))
})

test('uncompress should take all input types', async (t) => {
  const compressedValue = compressSync(stringToCompress)
  await t.notThrowsAsync(uncompress(compressedValue))
  await t.notThrowsAsync(uncompress(new Uint8Array(compressedValue)))
})
