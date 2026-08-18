<div align="center">
  <h1>⚡ lz4-napi</h1>
  <p>Node.js N-API bindings for the LZ4 compression algorithm.</p>
  <p>
    Powered by Rust,
    <a href="https://napi.rs">napi-rs</a>, and
    <a href="https://github.com/PSeitz/lz4_flex">lz4-flex</a>.
  </p>
</div>

<p align="center">
  <strong>⚡ Fast</strong> ·
  <strong>🔒 Memory safe</strong> ·
  <strong>🧵 Uses libuv's thread pool</strong>
</p>

---

## Table of contents

<!-- toc -->

- [Installation](#installation)
- [Usage](#usage)
  - [Compress data](#compress-data)
  - [Uncompress data](#uncompress-data)
- [API reference](#api-reference)
  - [Promise API](#promise-api)
    - [`compress`](#compress)
    - [`uncompress`](#uncompress)
    - [`compressFrame`](#compressframe)
    - [`decompressFrame`](#decompressframe)
  - [Synchronous API](#synchronous-api)
    - [`compressSync`](#compresssync)
    - [`uncompressSync`](#uncompresssync)
    - [`compressFrameSync`](#compressframesync)
    - [`decompressFrameSync`](#decompressframesync)
- [Performance](#performance)
  - [Hardware](#hardware)
  - [Benchmark](#benchmark)
- [Contributing](#contributing)
- [Acknowledgments](#acknowledgments)
- [License](#license)

<!-- tocstop -->

## Installation

Using npm:

```sh
npm install lz4-napi
```

Using Yarn:

```sh
yarn add lz4-napi
```

## Usage

### Compress data

```js
const { readFile } = require('fs/promises')
const { compress } = require('lz4-napi')

// If you support top-level await:
const buffer = await readFile('./bigFile.dat')
const compressedBuffer = await compress(buffer)

// Store the compressed buffer somewhere.
```

### Uncompress data

```js
const { uncompress } = require('lz4-napi')

// If you support top-level await:
const compressedBuffer = await getFromSomeStorage()
const uncompressedBuffer = await uncompress(compressedBuffer)

// Do something with the uncompressed buffer.
```

## API reference

### Promise API

#### `compress`

```ts
declare function compress(data: Buffer | string | ArrayBuffer | Uint8Array, dict?: string | Buffer): Promise<Buffer>
```

#### `uncompress`

```ts
declare function uncompress(data: Buffer | string | ArrayBuffer | Uint8Array, dict?: string | Buffer): Promise<Buffer>
```

#### `compressFrame`

```ts
declare function compressFrame(
  data: Buffer | string | ArrayBuffer | Uint8Array,
  options?: {
    contentChecksum?: boolean
    blockChecksums?: boolean
  },
) => Promise<Buffer>
```

#### `decompressFrame`

```ts
declare function decompressFrame(data: Buffer | string | ArrayBuffer | Uint8Array): Promise<Buffer>
```

### Synchronous API

#### `compressSync`

```ts
declare function compressSync(data: Buffer | string | ArrayBuffer | Uint8Array, dict?: string | Buffer): Buffer
```

#### `uncompressSync`

```ts
declare function uncompressSync(data: Buffer | string | ArrayBuffer | Uint8Array, dict?: string | Buffer): Buffer
```

#### `compressFrameSync`

```ts
declare function compressFrameSync(
  data: Buffer | string | ArrayBuffer | Uint8Array,
  options?: {
    contentChecksum?: boolean
    blockChecksums?: boolean
  },
) => Buffer
```

> [!NOTE]
> Both options default to `false`, matching the existing behavior. Set `contentChecksum` to have `decompressFrame` or `decompressFrameSync` reject a corrupted frame instead of silently returning incorrect bytes.

#### `decompressFrameSync`

```ts
declare function decompressFrameSync(data: Buffer | string | ArrayBuffer | Uint8Array): Buffer
```

## Performance

### Hardware

The benchmarks were run on the following hardware:

| Component | Specification |
| --------- | ------------- |
| Processor | M4 Pro        |
| CPU cores | 12            |
| Memory    | 24 GB         |

### Benchmark

#### Compression

| Algorithm  |      Throughput | Margin | Comparison                  |
| ---------- | --------------: | -----: | --------------------------- |
| `lz4`      |     7,355 ops/s | ±1.73% | 0.39% slower                |
| `lz4 dict` |     6,375 ops/s | ±0.29% | 13.66% slower               |
| `snappy`   | **7,384 ops/s** | ±0.53% | **Fastest**                 |
| `gzip`     |       444 ops/s | ±0.50% | 93.99% slower               |
| `deflate`  |       442 ops/s | ±0.62% | 94.01% slower               |
| `brotli`   |         6 ops/s | ±0.73% | **Slowest · 99.92% slower** |

#### Decompression

| Algorithm  |       Throughput | Margin | Comparison                  |
| ---------- | ---------------: | -----: | --------------------------- |
| `lz4`      | **19,095 ops/s** | ±1.51% | **Fastest**                 |
| `lz4 dict` |     17,644 ops/s | ±1.51% | 7.6% slower                 |
| `snappy`   |     14,424 ops/s | ±0.50% | 24.46% slower               |
| `gzip`     |      2,442 ops/s | ±0.60% | 87.21% slower               |
| `deflate`  |      2,467 ops/s | ±0.61% | 87.08% slower               |
| `brotli`   |      1,659 ops/s | ±0.43% | **Slowest · 91.31% slower** |

Each suite completed all six cases.

## Contributing

This project is intentionally simple and focused on my needs, but ideas and contributions are welcome.

> This project uses [Conventional Commits](https://commitlint.js.org/#/). Be sure to use the standard commit format, or your PR will not be accepted.

1. Fork the project.
2. Create your feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'feat(scope): some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a pull request.

## Acknowledgments

- [Brooooooklyn/snappy](https://github.com/Brooooooklyn/snappy) — inspiration and project structure

## License

Distributed under the MIT License. See [`LICENSE`](./LICENSE) for more information.
