#![deny(clippy::all)]

#[macro_use]
extern crate napi_derive;

use std::io::{BufWriter, Read, Write};

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
    BufferSlice::copy_from(env, output)
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
    BufferSlice::copy_from(env, output)
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
    BufferSlice::copy_from(env, output)
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
    BufferSlice::copy_from(env, output)
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

    let mut buf = vec![];

    let mut decoder = FrameDecoder::new(data);
    decoder.read_to_end(&mut buf)?;

    Ok(buf)
  }

  fn resolve(&mut self, env: &'a Env, output: Self::Output) -> Result<Self::JsValue> {
    BufferSlice::copy_from(env, output)
  }
}

struct FrameEnc {
  data: Either<String, Uint8Array>,
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

    let buf = BufWriter::new(&mut buffer);

    let mut encoder = FrameEncoder::new(buf);

    encoder.write_all(data)?;

    encoder
      .finish()
      .map_err(|e| Error::new(napi::Status::Unknown, e.to_string()))?;

    Ok(buffer)
  }

  fn resolve(&mut self, env: &'a Env, output: Self::Output) -> Result<Self::JsValue> {
    BufferSlice::copy_from(env, output)
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
fn compress_frame(data: Either<String, Uint8Array>) -> Result<AsyncTask<FrameEnc>> {
  let encoder = FrameEnc { data };
  Ok(AsyncTask::new(encoder))
}

#[napi]
fn decompress_frame(data: Either<String, Uint8Array>) -> Result<AsyncTask<FrameDec>> {
  let decoder = FrameDec { data };
  Ok(AsyncTask::new(decoder))
}

#[napi]
fn compress_frame_sync(data: Either<String, Buffer>) -> Result<Buffer> {
  let data_bytes: &[u8] = match data {
    Either::A(ref s) => s.as_bytes(),
    Either::B(ref b) => b,
  };

  let mut buffer = vec![];
  let mut encoder = FrameEncoder::new(&mut buffer);
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
  let mut buf = vec![];
  decoder
    .read_to_end(&mut buf)
    .map_err(|e| Error::new(napi::Status::GenericFailure, e.to_string()))?;

  Ok(buf.into())
}
