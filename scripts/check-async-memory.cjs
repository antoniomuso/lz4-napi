const assert = require('node:assert/strict')
const { resolve } = require('node:path')

// Allow comparison of separately built binaries without replacing the local addon.
const binding = process.env.LZ4_TEST_BINDING
const { compressSync, uncompress } = require(binding ? resolve(binding) : '../index.js')
const concurrency = 4
const iterations = 1200
const rssLimit = 512 * 1024 * 1024
const input = Buffer.alloc(6 * 1024 * 1024, 65)
const compressed = compressSync(input)
let completed = 0
let maxRss = 0

async function decompressAndCheck() {
  const output = await uncompress(compressed)
  assert.ok(output.equals(input), 'decompressed bytes differ')
}

async function runLane(lane) {
  for (let i = lane; i < iterations; i += concurrency) {
    // Release the output before sampling and let the event loop make progress.
    // Do not force GC: the regression must exercise normal Buffer finalization.
    await decompressAndCheck()
    completed++
    await new Promise((done) => setImmediate(done))
    maxRss = Math.max(maxRss, process.memoryUsage().rss)
    assert.ok(maxRss < rssLimit, `async buffer RSS exceeded 512 MiB after ${completed} operations: ${maxRss}`)
  }
}

async function main() {
  await Promise.all(Array.from({ length: concurrency }, (_, lane) => runLane(lane)))
  assert.equal(completed, iterations)
  console.info(JSON.stringify({ completed, concurrency, maxRss, node: process.version, arch: process.arch }))
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
