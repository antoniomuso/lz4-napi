#![deny(clippy::all)]

#[macro_use]
extern crate napi_derive;

use std::io::{Read, Write};

use lz4_flex::block::{compress_prepend_size_with_dict, decompress_size_prepended_with_dict};
use lz4_flex::frame::{FrameDecoder, FrameEncoder};
use lz4_flex::{compress_prepend_size, decompress_size_prepended};
use napi::bindgen_prelude::{BufferSlice, Uint8Array};
use napi::ScopedTask;
use napi::{
  bindgen_prelude::{AsyncTask, Buffer},
  Either, Env, Error, Result, Status,
};

#[cfg(all(
  not(target_family = "wasm"),
  not(target_env = "ohos"),
  not(target_env = "musl")
))]
#[global_allocator]
static GLOBAL: mimalloc_safe::MiMalloc = mimalloc_safe::MiMalloc;

const FRAME_PREALLOC_THRESHOLD: usize = 4 * 1024 * 1024 + 64;

fn frame_output_buffer(compressed_len: usize) -> Vec<u8> {
  if compressed_len > FRAME_PREALLOC_THRESHOLD {
    Vec::with_capacity(compressed_len)
  } else {
    Vec::new()
  }
}

struct Enc {
  data: Either<String, Uint8Array>,
}

#[napi]
impl<'a> ScopedTask<'a> for Enc {
  type Output = Vec<u8>;
  type JsValue = BufferSlice<'a>;

  fn compute(&mut self) -> Result<Self::Output> {
    let data: &[u8] = match self.data {
      Either::A(ref b) => b.as_bytes(),
      Either::B(ref s) => s,
    };
    Ok(compress_prepend_size(data))
  }

  fn resolve(&mut self, env: &'a Env, output: Self::Output) -> Result<Self::JsValue> {
    BufferSlice::from_data(env, output)
  }
}

struct Dec {
  data: Either<String, Uint8Array>,
}

#[napi]
impl<'a> ScopedTask<'a> for Dec {
  type Output = Vec<u8>;
  type JsValue = BufferSlice<'a>;

  fn compute(&mut self) -> Result<Self::Output> {
    let data: &[u8] = match self.data {
      Either::A(ref b) => b.as_bytes(),
      Either::B(ref s) => s,
    };
    decompress_size_prepended(data).map_err(|e| Error::new(Status::GenericFailure, format!("{e}")))
  }

  fn resolve(&mut self, env: &'a Env, output: Self::Output) -> Result<Self::JsValue> {
    BufferSlice::from_data(env, output)
  }
}

struct EncDict {
  data: Either<String, Uint8Array>,
  dict: Either<String, Uint8Array>,
}

#[napi]
impl<'a> ScopedTask<'a> for EncDict {
  type Output = Vec<u8>;
  type JsValue = BufferSlice<'a>;

  fn compute(&mut self) -> Result<Self::Output> {
    let data: &[u8] = match self.data {
      Either::A(ref b) => b.as_bytes(),
      Either::B(ref s) => s,
    };

    let dict: &[u8] = match self.dict {
      Either::A(ref b) => b.as_bytes(),
      Either::B(ref s) => s,
    };

    Ok(compress_prepend_size_with_dict(data, dict))
  }

  fn resolve(&mut self, env: &'a Env, output: Self::Output) -> Result<Self::JsValue> {
    BufferSlice::from_data(env, output)
  }
}

struct DecDict {
  data: Either<String, Uint8Array>,
  dict: Either<String, Uint8Array>,
}

#[napi]
impl<'a> ScopedTask<'a> for DecDict {
  type Output = Vec<u8>;
  type JsValue = BufferSlice<'a>;

  fn compute(&mut self) -> Result<Self::Output> {
    let data: &[u8] = match self.data {
      Either::A(ref b) => b.as_bytes(),
      Either::B(ref s) => s,
    };

    let dict: &[u8] = match self.dict {
      Either::A(ref b) => b.as_bytes(),
      Either::B(ref s) => s,
    };

    decompress_size_prepended_with_dict(data, dict)
      .map_err(|e| Error::new(Status::GenericFailure, format!("{e}")))
  }

  fn resolve(&mut self, env: &'a Env, output: Self::Output) -> Result<Self::JsValue> {
    BufferSlice::from_data(env, output)
  }
}

struct FrameDec {
  data: Either<String, Uint8Array>,
}

#[napi]
impl<'a> ScopedTask<'a> for FrameDec {
  type Output = Vec<u8>;
  type JsValue = BufferSlice<'a>;

  fn compute(&mut self) -> Result<Self::Output> {
    let data: &[u8] = match self.data {
      Either::A(ref b) => b.as_bytes(),
      Either::B(ref s) => s,
    };

    let mut buf = frame_output_buffer(data.len());

    let mut decoder = FrameDecoder::new(data);
    decoder.read_to_end(&mut buf)?;

    Ok(buf)
  }

  fn resolve(&mut self, env: &'a Env, output: Self::Output) -> Result<Self::JsValue> {
    BufferSlice::from_data(env, output)
  }
}

/// Frame checksum options, threaded through to lz4_flex's `FrameInfo`. An
/// unset field defers to `FrameInfo::default()` rather than a hardcoded
/// value, so passing no options stays a no-op even if lz4_flex ever changes
/// its own defaults - the same checksum behavior `compressFrame`/
/// `compressFrameSync` have always had.
#[napi(object)]
#[derive(Default)]
pub struct FrameCompressOptions {
  pub content_checksum: Option<bool>,
  pub block_checksums: Option<bool>,
}

fn frame_info_from_options(options: Option<FrameCompressOptions>) -> lz4_flex::frame::FrameInfo {
  let options = options.unwrap_or_default();
  let mut frame_info = lz4_flex::frame::FrameInfo::default();
  if let Some(content_checksum) = options.content_checksum {
    frame_info = frame_info.content_checksum(content_checksum);
  }
  if let Some(block_checksums) = options.block_checksums {
    frame_info = frame_info.block_checksums(block_checksums);
  }
  frame_info
}

struct FrameEnc {
  data: Either<String, Uint8Array>,
  options: Option<FrameCompressOptions>,
}

#[napi]
impl<'a> ScopedTask<'a> for FrameEnc {
  type Output = Vec<u8>;
  type JsValue = BufferSlice<'a>;

  fn compute(&mut self) -> Result<Self::Output> {
    let data: &[u8] = match self.data {
      Either::A(ref b) => b.as_bytes(),
      Either::B(ref s) => s,
    };

    let mut buffer = vec![];

    let frame_info = frame_info_from_options(self.options.take());
    let mut encoder = FrameEncoder::with_frame_info(frame_info, &mut buffer);

    encoder.write_all(data)?;

    encoder
      .finish()
      .map_err(|e| Error::new(napi::Status::Unknown, e.to_string()))?;

    Ok(buffer)
  }

  fn resolve(&mut self, env: &'a Env, output: Self::Output) -> Result<Self::JsValue> {
    BufferSlice::from_data(env, output)
  }
}

#[napi]
fn compress(
  data: Either<String, Uint8Array>,
  dict: Option<Either<String, Uint8Array>>,
) -> Result<Either<AsyncTask<Enc>, AsyncTask<EncDict>>> {
  if let Option::Some(v) = dict {
    let encoder = EncDict { data, dict: v };
    return Ok(Either::B(AsyncTask::new(encoder)));
  }
  let encoder = Enc { data };
  Ok(Either::A(AsyncTask::new(encoder)))
}

#[napi]
fn uncompress(
  data: Either<String, Uint8Array>,
  dict: Option<Either<String, Uint8Array>>,
) -> Result<Either<AsyncTask<Dec>, AsyncTask<DecDict>>> {
  if let Option::Some(v) = dict {
    let decoder = DecDict { data, dict: v };
    return Ok(Either::B(AsyncTask::new(decoder)));
  }
  let decoder = Dec { data };
  Ok(Either::A(AsyncTask::new(decoder)))
}

#[napi]
fn uncompress_sync<'a>(
  env: Env,
  data: Either<String, &'a [u8]>,
  dict: Option<Either<String, &'a [u8]>>,
) -> Result<BufferSlice<'a>> {
  if let Option::Some(v) = dict {
    return decompress_size_prepended_with_dict(
      match data {
        Either::A(ref s) => s.as_bytes(),
        Either::B(b) => b,
      },
      match v {
        Either::A(ref s) => s.as_bytes(),
        Either::B(b) => b,
      },
    )
    .map_err(|e| Error::new(napi::Status::GenericFailure, format!("{e}")))
    .and_then(|s| BufferSlice::copy_from(&env, s));
  }
  decompress_size_prepended(match data {
    Either::A(ref s) => s.as_bytes(),
    Either::B(b) => b,
  })
  .map_err(|e| Error::new(napi::Status::GenericFailure, format!("{e}")))
  .and_then(|d| BufferSlice::copy_from(&env, d))
}

#[napi]
fn compress_sync(
  data: Either<String, Buffer>,
  dict: Option<Either<String, Buffer>>,
) -> Result<Buffer> {
  if let Option::Some(v) = dict {
    return Ok(
      compress_prepend_size_with_dict(
        match data {
          Either::A(ref s) => s.as_bytes(),
          Either::B(ref b) => b,
        },
        match v {
          Either::A(ref s) => s.as_bytes(),
          Either::B(ref b) => b,
        },
      )
      .into(),
    );
  }
  Ok(
    compress_prepend_size(match data {
      Either::A(ref s) => s.as_bytes(),
      Either::B(ref b) => b,
    })
    .into(),
  )
}

#[napi]
fn compress_frame(
  data: Either<String, Uint8Array>,
  options: Option<FrameCompressOptions>,
) -> Result<AsyncTask<FrameEnc>> {
  let encoder = FrameEnc { data, options };
  Ok(AsyncTask::new(encoder))
}

#[napi]
fn decompress_frame(data: Either<String, Uint8Array>) -> Result<AsyncTask<FrameDec>> {
  let decoder = FrameDec { data };
  Ok(AsyncTask::new(decoder))
}

#[napi]
fn compress_frame_sync(
  data: Either<String, Buffer>,
  options: Option<FrameCompressOptions>,
) -> Result<Buffer> {
  let data_bytes: &[u8] = match data {
    Either::A(ref s) => s.as_bytes(),
    Either::B(ref b) => b,
  };

  let mut buffer = vec![];
  let frame_info = frame_info_from_options(options);
  let mut encoder = FrameEncoder::with_frame_info(frame_info, &mut buffer);
  encoder
    .write_all(data_bytes)
    .map_err(|e| Error::new(napi::Status::GenericFailure, e.to_string()))?;
  encoder
    .finish()
    .map_err(|e| Error::new(napi::Status::GenericFailure, e.to_string()))?;

  Ok(buffer.into())
}

#[napi]
fn decompress_frame_sync(data: Either<String, Buffer>) -> Result<Buffer> {
  let data_bytes: &[u8] = match data {
    Either::A(ref s) => s.as_bytes(),
    Either::B(ref b) => b,
  };

  let mut decoder = FrameDecoder::new(data_bytes);
  let mut buf = frame_output_buffer(data_bytes.len());
  decoder
    .read_to_end(&mut buf)
    .map_err(|e| Error::new(napi::Status::GenericFailure, e.to_string()))?;

  Ok(buf.into())
}
