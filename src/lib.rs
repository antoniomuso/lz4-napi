#![deny(clippy::all)]

#[macro_use]
extern crate napi_derive;

use lz4_flex::{compress_prepend_size, decompress_size_prepended};
use napi::{
  CallContext, Env, Error, JsBuffer, JsBufferValue, JsObject, JsUnknown, Ref, Result, Status, Task,
};

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

impl Task for Enc {
  type Output = Vec<u8>;
  type JsValue = JsBuffer;

  fn compute(&mut self) -> Result<Self::Output> {
    let data: &[u8] = &self.data;
    Ok(compress_prepend_size(data))
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

struct Dec {
  data: Ref<JsBufferValue>,
}

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

#[module_exports]
fn init(mut exports: JsObject) -> Result<()> {
  exports.create_named_method("compress", compress_data)?;
  exports.create_named_method("uncompress", uncompress_data)?;
  exports.create_named_method("compress_sync", compress_data_sync)?;
  exports.create_named_method("uncompress_sync", uncompress_data_sync)?;
  Ok(())
}

#[js_function(1)]
fn compress_data(ctx: CallContext) -> Result<JsObject> {
  let data = ctx.get::<JsBuffer>(0)?;
  let encoder = Enc {
    data: data.into_ref()?,
  };
  ctx.env.spawn(encoder).map(|v| v.promise_object())
}

#[js_function(1)]
fn uncompress_data(ctx: CallContext) -> Result<JsObject> {
  let data = ctx.get::<JsBuffer>(0)?;
  let decoder = Dec {
    data: data.into_ref()?,
  };
  ctx.env.spawn(decoder).map(|v| v.promise_object())
}

#[js_function(1)]
fn uncompress_data_sync(ctx: CallContext) -> Result<JsUnknown> {
  let data = ctx.get::<JsBuffer>(0)?;
  decompress_size_prepended(&data.into_value()?)
    .map_err(|e| Error::new(napi::Status::GenericFailure, format!("{}", e)))
    .and_then(|d| {
      ctx
        .env
        .create_buffer_with_data(d)
        .map(|b| b.into_raw().into_unknown())
    })
}

#[js_function(1)]
fn compress_data_sync(ctx: CallContext) -> Result<JsUnknown> {
  let data = ctx.get::<JsBuffer>(0)?;
  ctx
    .env
    .create_buffer_with_data(compress_prepend_size(&data.into_value()?))
    .map(|op| op.into_raw().into_unknown())
}
