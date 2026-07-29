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
    7 499 ops/s, ±2.92%   | fastest

  lz4 dict:
    6 285 ops/s, ±0.33%   | 16.19% slower

  snappy:
    6 984 ops/s, ±0.93%   | 6.87% slower

  gzip:
    416 ops/s, ±0.46%     | 94.45% slower

  deflate:
    415 ops/s, ±0.42%     | 94.47% slower

  brotli:
    5 ops/s, ±0.09%       | slowest, 99.93% slower

Finished 6 cases!
  Fastest: lz4
  Slowest: brotli
Running "Decompress" suite...
Progress: 100%

  lz4:
    27 264 ops/s, ±0.47%   | fastest

  lz4 dict:
    24 190 ops/s, ±0.32%   | 11.27% slower

  snappy:
    14 767 ops/s, ±0.43%   | 45.84% slower

  gzip:
    2 390 ops/s, ±0.89%    | 91.23% slower

  deflate:
    2 449 ops/s, ±0.52%    | 91.02% slower

  brotli:
    1 670 ops/s, ±0.33%    | slowest, 93.87% slower

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
