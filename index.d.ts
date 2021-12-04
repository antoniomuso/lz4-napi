export const compress: (data: Buffer | string | ArrayBuffer | Uint8Array) => Promise<Buffer>
export const uncompress: (data: Buffer | ArrayBuffer | Uint8Array) => Promise<Buffer>
export const compressSync: (data: Buffer | string | ArrayBuffer | Uint8Array) => Buffer
export const uncompressSync: (data: Buffer | ArrayBuffer | Uint8Array) => Buffer
