#![deny(clippy::all)]

#[macro_use]
extern crate napi_derive;

use lz4_flex::{compress_prepend_size, decompress_size_prepended};
use napi::{bindgen_prelude::*, JsBuffer, JsBufferValue, Ref, JsUnknown};

#[cfg(all(
  any(windows, unix),
  target_arch = "x86_64",
  not(target_env = "musl"),
  not(debug_assertions)
))]
#[global_allocator]
static ALLOC: mimalloc::MiMalloc = mimalloc::MiMalloc;

struct Enc {
  data: Ref<JsBufferValue>,
}

#[napi]
impl Task for Enc {
  type Output = Vec<u8>;
  type JsValue = JsBuffer;

  fn compute(&mut self) -> Result<Self::Output> {
    let data: &[u8] = &self.data;
    Ok(compress_prepend_size(data))
  }

  fn resolve(&mut self, env: Env, output: Self::Output) -> Result<Self::JsValue> {
    self.data.unref(env)?;
    env.create_buffer_with_data(output).map(|b| b.into_raw())
  }

  fn reject(&mut self, env: Env, err: Error) -> Result<Self::JsValue> {
    self.data.unref(env)?;
    Err(err)
  }
}

struct Dec {
  data: Ref<JsBufferValue>,
}

#[napi]
impl Task for Dec {
  type Output = Vec<u8>;
  type JsValue = JsBuffer;

  fn compute(&mut self) -> Result<Self::Output> {
    let data: &[u8] = &self.data;
    decompress_size_prepended(data)
      .map_err(|e| Error::new(Status::GenericFailure, format!("{}", e)))
  }

  fn resolve(self, env: Env, output: Self::Output) -> Result<Self::JsValue> {
    self.data.unref(env)?;
    env.create_buffer_with_data(output).map(|b| b.into_raw())
  }

  fn reject(self, env: Env, err: Error) -> Result<Self::JsValue> {
    self.data.unref(env)?;
    Err(err)
  }
}

#[js_function(1)]
fn compress_data(data: JsBuffer) -> Result<JsObject> {
  let data = ctx.get::<JsBuffer>(0)?;
  let encoder = Enc {
    data: data.into_ref()?,
  };
  ctx.env.spawn(encoder).map(|v| v.promise_object())
}

#[napi]
fn uncompress_data(data: JsBuffer) -> Result<JsObject> {
  let decoder = Dec {
    data: data.into_ref()?,
  };
  ctx.env.spawn(decoder).map(|v| v.promise_object())
}

#[napi]
fn uncompress_data_sync(data: JsBuffer) -> Result<JsUnknown> {
  decompress_size_prepended(&data.into_value()?)
    .map_err(|e| Error::new(napi::Status::GenericFailure, format!("{}", e)))
    .and_then(|d| {
      ctx
        .env
        .create_buffer_with_data(d)
        .map(|b| b.into_raw().into_unknown())
    })
}

#[napi]
fn compress_data_sync(data: JsBuffer) -> Result<JsUnknown> {
  let data = ctx.get::<JsBuffer>(0)?;
  ctx
    .env
    .create_buffer_with_data(compress_prepend_size(&data.into_value()?))
    .map(|op| op.into_raw().into_unknown())
}
