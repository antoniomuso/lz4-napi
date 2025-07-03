import { readFileSync } from 'fs'

import test from 'ava'

import { compress, uncompress, compressSync, uncompressSync, compressFrame, decompressFrame, compressFrameSync, decompressFrameSync } from '../index.js'

const stringToCompress = 'adewqeqweqwewleekqwoekqwoekqwpoekqwpoekqwpoekqwpoekqwpoekqwpokeeqw'
const dict = readFileSync('__test__/dict.bin')

test('compress should return smaller value', async (t) => {
  const before = Buffer.from(stringToCompress)
  const compressed = await compress(before)
  t.true(before.length > compressed.length)
  t.true(compressed.length !== 0)
})

test('compressFrame should return smaller value', async (t) => {
  const before = Buffer.from(stringToCompress)
  const compressed = await compressFrame(before)
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
  t.notThrows(() => compressFrameSync(new Uint8Array(stringBuffer)))
})

test('decompressFrameSync should take all input types', (t) => {
  const compressedValue = compressFrameSync(stringToCompress)
  t.notThrows(() => decompressFrameSync(compressedValue))
  t.notThrows(() => decompressFrameSync(new Uint8Array(compressedValue)))
})

test('frame sync and async should produce compatible output', async (t) => {
  const before = Buffer.from(stringToCompress)
  const compressedSync = compressFrameSync(before)
  const compressedAsync = await compressFrame(before)
  
  // Both async and sync decompression should work on sync compressed data
  const decompressedSync = decompressFrameSync(compressedSync)
  const decompressedAsync = await decompressFrame(compressedSync)
  t.is(before.toString('utf8'), decompressedSync.toString('utf8'))
  t.is(before.toString('utf8'), decompressedAsync.toString('utf8'))
  
  // Both async and sync decompression should work on async compressed data
  const decompressedSync2 = decompressFrameSync(compressedAsync)
  const decompressedAsync2 = await decompressFrame(compressedAsync)
  t.is(before.toString('utf8'), decompressedSync2.toString('utf8'))
  t.is(before.toString('utf8'), decompressedAsync2.toString('utf8'))
})
