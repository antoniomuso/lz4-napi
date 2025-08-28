// Re-export all native bindings
export * from './nativeBindings'

// Import Transform stream types
import { Transform, TransformOptions } from 'stream'

// Node.js Transform streams (high-level API)
export declare class EncoderStream extends Transform {
  constructor(options?: TransformOptions)
}

export declare class DecoderStream extends Transform {
  constructor(options?: TransformOptions)
}

export declare function createEncoderStream(options?: TransformOptions): EncoderStream
export declare function createDecoderStream(options?: TransformOptions): DecoderStream
