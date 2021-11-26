export const compress: (data: Buffer | string) => Promise<Buffer>
export const uncompress: (data: Buffer) => Promise<Buffer>
export const compressSync: (data: Buffer) => Buffer
export const uncompressSync: (data: Buffer) => Buffer
