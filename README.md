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
```

### Sync

#### `compressSync`

```ts
(data: Buffer | string | ArrayBuffer | Uint8Array, dict?: string | Buffer) => Buffer
```

#### `uncompressSync`

```ts
(data: Buffer | string | ArrayBuffer | Uint8Array, dict?: string | Buffer) => Buffer
```
#### `compressFrameSync`

```ts
(data: Buffer | string | ArrayBuffer | Uint8Array) => Buffer
```

#### `decompressFrameSync`

```ts
(data: Buffer | string | ArrayBuffer | Uint8Array) => Buffer
```

## Performance

### Hardware

Benchmarks runs on the following hardware:

- Processor Name: M4 pro
- Total Number of Cores: 12
- Memory: 24GB

### Benchmark

```sh
Running "Compress" suite...
Progress: 100%

  lz4:
    7 355 ops/s, ±1.73%   | 0.39% slower

  lz4 dict:
    6 375 ops/s, ±0.29%   | 13.66% slower

  snappy:
    7 384 ops/s, ±0.53%   | fastest

  gzip:
    444 ops/s, ±0.50%     | 93.99% slower

  deflate:
    442 ops/s, ±0.62%     | 94.01% slower

  brotli:
    6 ops/s, ±0.73%       | slowest, 99.92% slower

Finished 6 cases!
  Fastest: snappy
  Slowest: brotli
Running "Decompress" suite...
Progress: 100%

  lz4:
    19 095 ops/s, ±1.51%   | fastest

  lz4 dict:
    17 644 ops/s, ±1.51%   | 7.6% slower

  snappy:
    14 424 ops/s, ±0.50%   | 24.46% slower

  gzip:
    2 442 ops/s, ±0.60%    | 87.21% slower

  deflate:
    2 467 ops/s, ±0.61%    | 87.08% slower

  brotli:
    1 659 ops/s, ±0.43%    | slowest, 91.31% slower

Finished 6 cases!
  Fastest: lz4
  Slowest: brotli
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
