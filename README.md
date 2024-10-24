# lz4-napi  

> Node.js NAPI Binding for LZ4 compression algorithm, powered by Rust [napi-rs](https://napi.rs) and [lz4-flex](https://github.com/PSeitz/lz4_flex).

**Pros:**

- Fast! ⚡️
- Memory Safe! 🔒
- Uses libuv's threadpool! 🧵

## Table of content

<!-- toc -->

- [Installation](#installation)
- [Usage](#usage)
  - [Compress](#compress)
  - [Uncompress](#uncompress)
- [APIs](#apis)
  - [Promises](#promises)
    - [`compress`](#compress)
    - [`uncompress`](#uncompress)
  - [Sync](#sync)
    - [`compressSync`](#compresssync)
    - [`uncompressSync`](#uncompresssync)
- [Benchmarks](#benchmarks)
- [Performance](#performance)
  - [Hardware](#hardware)
  - [Results](#results)
- [Contributing](#contributing)
- [License](#license)

<!-- tocstop -->

<!-- GETTING STARTED -->
## Installation

```sh
npm i lz4-napi
# OR
yarn add lz4-napi
```

<!-- USAGE EXAMPLES -->

## Usage

### Compress

```js
const { readFile } = require('fs/promises');
const { compress } = require('lz4-napi');

// if you support top-level await
const buffer = await readFile("./bigFile.dat");
const compressedBuffer = await compress(buffer)
// Store compressed buffer somewhere
```

### Uncompress

```js
const { uncompress } = require('lz4-napi');

// if you support top-level await
const compressedBuffer = await getFromSomeStorage();
const uncompressedBuffer = await uncompress(compressedBuffer)
// Do something with compressedBuffer!
```

## APIs

### Promise

#### `compress`

```ts
(data: Buffer | string | ArrayBuffer | Uint8Array, dict?: string | Buffer) => Promise<Buffer>
```

#### `uncompress`

```ts
(data: Buffer | string | ArrayBuffer | Uint8Array, dict?: string | Buffer) => Promise<Buffer>
```

#### `compressFrame`

```ts
(data: Buffer | string | ArrayBuffer | Uint8Array) => Promise<Buffer>
```

#### `decompressFrame`

```ts
(data: Buffer | string | ArrayBuffer | Uint8Array) => Promise<Buffer>

### Sync

#### `compressSync`

```ts
(data: Buffer | string | ArrayBuffer | Uint8Array, dict?: string | Buffer) => Buffer
```

#### `uncompressSync`

```ts
(data: Buffer | string | ArrayBuffer | Uint8Array, dict?: string | Buffer) => Buffer
```

## Performance

### Hardware

Benchmarks runs on the following hardware:

- Processor Name: i9 9900K
- Total Number of Cores: 8
- Hyper-Threading Technology: Enabled
- Memory: 32 GB

### Benchmark

```sh
Running "Compress" suite...
Progress: 100%

  lz4:
    911 ops/s, ±18.64%     | 54.68% slower

  snappy:
    2 010 ops/s, ±19.23%   | fastest

  gzip:
    78 ops/s, ±18.76%      | 96.12% slower

  deflate:
    118 ops/s, ±20.42%     | 94.13% slower

  brotli:
    6 ops/s, ±0.21%       | slowest, 99.7% slower

Finished 5 cases!
  Fastest: snappy
  Slowest: brotli
Running "Decompress" suite...
Progress: 100%

  lz4:
    9 425 ops/s, ±12.50%   | fastest

  snappy:
    3 900 ops/s, ±13.39%   | 58.62% slower

  gzip:
    823 ops/s, ±20.48%     | slowest, 91.27% slower

  deflate:
    1 350 ops/s, ±12.52%   | 85.68% slower

  brotli:
    979 ops/s, ±11.55%     | 89.61% slower

Finished 5 cases!
  Fastest: lz4
  Slowest: gzip
Done in 61.20s.
```

<!-- CONTRIBUTING -->

## Contributing

Project is pretty simple and straight forward for what is my needs, but if you have any idea you're welcome.

> This projects uses [conventional commit](https://commitlint.js.org/#/) so be sure to use standard commit format or PR won't be accepted

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'feat(scope): some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

<!-- ACKNOWLEDGMENTS -->
## Acknowledgments

- [Brooooooklyn/snappy](https://github.com/Brooooooklyn/snappy) - Inspiration and project structure

<!-- LICENSE -->

## License

Distributed under the MIT License. See `LICENSE` for more information.
