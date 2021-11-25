import test from 'ava'

import { compress, decompress, compress_sync, decompress_sync } from '../index.js'

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
  const decompressed = await decompress(compressed)
  t.is(before.toString('utf8'), decompressed.toString('utf8'))
})


test('compress decompress sync should work', (t) => {
  const before = Buffer.from(stringToCompress)
  const compressed = compress_sync(before)
  t.true(before.length > compressed.length)
  const decompressed = decompress_sync(compressed)
  t.is(before.toString('utf8'), decompressed.toString('utf8'))
})
