# Lz4

Fastest lz4 compression library in Node.js, powered by [napi-rs](https://napi.rs) and [lz4-flex](https://github.com/PSeitz/lz4_flex).

## Install this package

```bash
yarn add lz4-napi
```

## API 

```ts
export function compress: (data: Buffer | string | ArrayBuffer | Uint8Array) => Promise<Buffer>
export function uncompress: (data: Buffer | string | ArrayBuffer | Uint8Array) => Promise<Buffer>
export function compressSync: (data: Buffer | string | ArrayBuffer | Uint8Array) => Buffer
export function uncompressSync: (data: Buffer | string | ArrayBuffer | Uint8Array) => Buffer
```


## Performance

### Hardware

```
Processor Name: i9 9900K
Total Number of Cores: 8
Hyper-Threading Technology: Enabled
Memory: 32 GB
```

### Result

```
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
