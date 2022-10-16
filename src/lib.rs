#![deny(clippy::all)]

#[macro_use]
extern crate napi_derive;

use lz4_flex::block::{compress_prepend_size_with_dict, decompress_size_prepended_with_dict};
use lz4_flex::{compress_prepend_size, decompress_size_prepended};
use napi::{
  bindgen_prelude::{AsyncTask, Buffer},
  Either, Env, Error, JsBuffer, JsBufferValue, Ref, Result, Status, Task,
};

#[cfg(all(
  target_arch = "x86_64",
  not(target_env = "musl"),
  not(debug_assertions)
))]
#[global_allocator]
static ALLOC: mimalloc::MiMalloc = mimalloc::MiMalloc;

pub enum Data {
  Buffer(Ref<JsBufferValue>),
  String(String),
}

impl TryFrom<Either<String, JsBuffer>> for Data {
  type Error = Error;

  fn try_from(value: Either<String, JsBuffer>) -> Result<Self> {
    match value {
      Either::A(s) => Ok(Data::String(s)),
      Either::B(b) => Ok(Data::Buffer(b.into_ref()?)),
    }
  }
}

struct Enc {
  data: Data,
}

#[napi]
impl Task for Enc {
  type Output = Vec<u8>;
  type JsValue = JsBuffer;

  fn compute(&mut self) -> Result<Self::Output> {
    let data: &[u8] = match self.data {
      Data::Buffer(ref b) => b.as_ref(),
      Data::String(ref s) => s.as_bytes(),
    };
    Ok(compress_prepend_size(data))
  }

  fn resolve(&mut self, env: Env, output: Self::Output) -> Result<Self::JsValue> {
    env.create_buffer_with_data(output).map(|b| b.into_raw())
  }

  fn finally(&mut self, env: Env) -> Result<()> {
    if let Data::Buffer(b) = &mut self.data {
      b.unref(env)?;
    }
    Ok(())
  }
}

struct Dec {
  data: Data,
}

#[napi]
impl Task for Dec {
  type Output = Vec<u8>;
  type JsValue = JsBuffer;

  fn compute(&mut self) -> Result<Self::Output> {
    let data: &[u8] = match self.data {
      Data::Buffer(ref b) => b.as_ref(),
      Data::String(ref s) => s.as_bytes(),
    };
    decompress_size_prepended(data)
      .map_err(|e| Error::new(Status::GenericFailure, format!("{}", e)))
  }

  fn resolve(&mut self, env: Env, output: Self::Output) -> Result<Self::JsValue> {
    env.create_buffer_with_data(output).map(|b| b.into_raw())
  }

  fn finally(&mut self, env: Env) -> Result<()> {
    if let Data::Buffer(b) = &mut self.data {
      b.unref(env)?;
    }
    Ok(())
  }
}

struct EncDict {
  data: Data,
  dict: Data,
}

#[napi]
impl Task for EncDict {
  type Output = Vec<u8>;
  type JsValue = JsBuffer;

  fn compute(&mut self) -> Result<Self::Output> {
    let data: &[u8] = match self.data {
      Data::Buffer(ref b) => b.as_ref(),
      Data::String(ref s) => s.as_bytes(),
    };

    let dict: &[u8] = match self.dict {
      Data::Buffer(ref b) => b.as_ref(),
      Data::String(ref s) => s.as_bytes(),
    };

    Ok(compress_prepend_size_with_dict(data, dict))
  }

  fn resolve(&mut self, env: Env, output: Self::Output) -> Result<Self::JsValue> {
    env.create_buffer_with_data(output).map(|b| b.into_raw())
  }

  fn finally(&mut self, env: Env) -> Result<()> {
    if let Data::Buffer(b) = &mut self.data {
      b.unref(env)?;
    }
    Ok(())
  }
}

struct DecDict {
  data: Data,
  dict: Data,
}

#[napi]
impl Task for DecDict {
  type Output = Vec<u8>;
  type JsValue = JsBuffer;

  fn compute(&mut self) -> Result<Self::Output> {
    let data: &[u8] = match self.data {
      Data::Buffer(ref b) => b.as_ref(),
      Data::String(ref s) => s.as_bytes(),
    };

    let dict: &[u8] = match self.dict {
      Data::Buffer(ref b) => b.as_ref(),
      Data::String(ref s) => s.as_bytes(),
    };

    decompress_size_prepended_with_dict(data, dict)
      .map_err(|e| Error::new(Status::GenericFailure, format!("{}", e)))
  }

  fn resolve(&mut self, env: Env, output: Self::Output) -> Result<Self::JsValue> {
    env.create_buffer_with_data(output).map(|b| b.into_raw())
  }

  fn finally(&mut self, env: Env) -> Result<()> {
    if let Data::Buffer(b) = &mut self.data {
      b.unref(env)?;
    }
    Ok(())
  }
}

#[napi]
fn compress(
  data: Either<String, JsBuffer>,
  dict: Option<Either<String, JsBuffer>>,
) -> Result<Either<AsyncTask<Enc>, AsyncTask<EncDict>>> {
  if let Option::Some(v) = dict {
    let encoder = EncDict {
      data: data.try_into()?,
      dict: v.try_into()?,
    };
    return Ok(Either::B(AsyncTask::new(encoder)));
  }
  let encoder = Enc {
    data: data.try_into()?,
  };
  Ok(Either::A(AsyncTask::new(encoder)))
}

#[napi]
fn decompress(
  data: Either<String, JsBuffer>,
  dict: Option<Either<String, JsBuffer>>,
) -> Result<Either<AsyncTask<Dec>, AsyncTask<DecDict>>> {
  if let Option::Some(v) = dict {
    let decoder = DecDict {
      data: data.try_into()?,
      dict: v.try_into()?,
    };
    return Ok(Either::B(AsyncTask::new(decoder)));
  }
  let decoder = Dec {
    data: data.try_into()?,
  };
  Ok(Either::A(AsyncTask::new(decoder)))
}

#[napi]
fn decompress_sync(
  data: Either<String, Buffer>,
  dict: Option<Either<String, Buffer>>,
) -> Result<Buffer> {
  if let Option::Some(v) = dict {
    return decompress_size_prepended_with_dict(
      match data {
        Either::A(ref s) => s.as_bytes(),
        Either::B(ref b) => b.as_ref(),
      },
      match v {
        Either::A(ref s) => s.as_bytes(),
        Either::B(ref b) => b.as_ref(),
      },
    )
    .map_err(|e| Error::new(napi::Status::GenericFailure, format!("{}", e)))
    .map(|d| d.into());
  }
  decompress_size_prepended(match data {
    Either::A(ref s) => s.as_bytes(),
    Either::B(ref b) => b.as_ref(),
  })
  .map_err(|e| Error::new(napi::Status::GenericFailure, format!("{}", e)))
  .map(|d| d.into())
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
          Either::A(ref b) => b.as_bytes(),
          Either::B(ref s) => s.as_ref(),
        },
        match v {
          Either::A(ref b) => b.as_bytes(),
          Either::B(ref s) => s.as_ref(),
        },
      )
      .into(),
    );
  }
  Ok(
    compress_prepend_size(match data {
      Either::A(ref b) => b.as_bytes(),
      Either::B(ref s) => s.as_ref(),
    })
    .into(),
  )
}
