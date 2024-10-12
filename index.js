"use strict";const{readFileSync}=require("fs");let nativeBinding=null;const loadErrors=[],isMusl=()=>{let r=!1;return process.platform==="linux"&&(r=isMuslFromFilesystem(),r===null&&(r=isMuslFromReport()),r===null&&(r=isMuslFromChildProcess())),r},isFileMusl=r=>r.includes("libc.musl-")||r.includes("ld-musl-"),isMuslFromFilesystem=()=>{try{return readFileSync("/usr/bin/ldd","utf-8").includes("musl")}catch{return null}},isMuslFromReport=()=>{const r=typeof process.report.getReport=="function"?process.report.getReport():null;return r?r.header&&r.header.glibcVersionRuntime?!1:!!(Array.isArray(r.sharedObjects)&&r.sharedObjects.some(isFileMusl)):null},isMuslFromChildProcess=()=>{try{return require("child_process").execSync("ldd --version",{encoding:"utf8"}).includes("musl")}catch{return!1}};function requireNative(){if(process.platform==="android")if(process.arch==="arm64"){try{return require("./lz4-napi.android-arm64.node")}catch(r){loadErrors.push(r)}try{return require("lz4-napi-android-arm64")}catch(r){loadErrors.push(r)}}else if(process.arch==="arm"){try{return require("./lz4-napi.android-arm-eabi.node")}catch(r){loadErrors.push(r)}try{return require("lz4-napi-android-arm-eabi")}catch(r){loadErrors.push(r)}}else loadErrors.push(new Error(`Unsupported architecture on Android ${process.arch}`));else if(process.platform==="win32")if(process.arch==="x64"){try{return require("./lz4-napi.win32-x64-msvc.node")}catch(r){loadErrors.push(r)}try{return require("lz4-napi-win32-x64-msvc")}catch(r){loadErrors.push(r)}}else if(process.arch==="ia32"){try{return require("./lz4-napi.win32-ia32-msvc.node")}catch(r){loadErrors.push(r)}try{return require("lz4-napi-win32-ia32-msvc")}catch(r){loadErrors.push(r)}}else if(process.arch==="arm64"){try{return require("./lz4-napi.win32-arm64-msvc.node")}catch(r){loadErrors.push(r)}try{return require("lz4-napi-win32-arm64-msvc")}catch(r){loadErrors.push(r)}}else loadErrors.push(new Error(`Unsupported architecture on Windows: ${process.arch}`));else if(process.platform==="darwin"){try{return require("./lz4-napi.darwin-universal.node")}catch(r){loadErrors.push(r)}try{return require("lz4-napi-darwin-universal")}catch(r){loadErrors.push(r)}if(process.arch==="x64"){try{return require("./lz4-napi.darwin-x64.node")}catch(r){loadErrors.push(r)}try{return require("lz4-napi-darwin-x64")}catch(r){loadErrors.push(r)}}else if(process.arch==="arm64"){try{return require("./lz4-napi.darwin-arm64.node")}catch(r){loadErrors.push(r)}try{return require("lz4-napi-darwin-arm64")}catch(r){loadErrors.push(r)}}else loadErrors.push(new Error(`Unsupported architecture on macOS: ${process.arch}`))}else if(process.platform==="freebsd")if(process.arch==="x64"){try{return require("./lz4-napi.freebsd-x64.node")}catch(r){loadErrors.push(r)}try{return require("lz4-napi-freebsd-x64")}catch(r){loadErrors.push(r)}}else if(process.arch==="arm64"){try{return require("./lz4-napi.freebsd-arm64.node")}catch(r){loadErrors.push(r)}try{return require("lz4-napi-freebsd-arm64")}catch(r){loadErrors.push(r)}}else loadErrors.push(new Error(`Unsupported architecture on FreeBSD: ${process.arch}`));else if(process.platform==="linux")if(process.arch==="x64")if(isMusl()){try{return require("./lz4-napi.linux-x64-musl.node")}catch(r){loadErrors.push(r)}try{return require("lz4-napi-linux-x64-musl")}catch(r){loadErrors.push(r)}}else{try{return require("./lz4-napi.linux-x64-gnu.node")}catch(r){loadErrors.push(r)}try{return require("lz4-napi-linux-x64-gnu")}catch(r){loadErrors.push(r)}}else if(process.arch==="arm64")if(isMusl()){try{return require("./lz4-napi.linux-arm64-musl.node")}catch(r){loadErrors.push(r)}try{return require("lz4-napi-linux-arm64-musl")}catch(r){loadErrors.push(r)}}else{try{return require("./lz4-napi.linux-arm64-gnu.node")}catch(r){loadErrors.push(r)}try{return require("lz4-napi-linux-arm64-gnu")}catch(r){loadErrors.push(r)}}else if(process.arch==="arm")if(isMusl()){try{return require("./lz4-napi.linux-arm-musleabihf.node")}catch(r){loadErrors.push(r)}try{return require("lz4-napi-linux-arm-musleabihf")}catch(r){loadErrors.push(r)}}else{try{return require("./lz4-napi.linux-arm-gnueabihf.node")}catch(r){loadErrors.push(r)}try{return require("lz4-napi-linux-arm-gnueabihf")}catch(r){loadErrors.push(r)}}else if(process.arch==="riscv64")if(isMusl()){try{return require("./lz4-napi.linux-riscv64-musl.node")}catch(r){loadErrors.push(r)}try{return require("lz4-napi-linux-riscv64-musl")}catch(r){loadErrors.push(r)}}else{try{return require("./lz4-napi.linux-riscv64-gnu.node")}catch(r){loadErrors.push(r)}try{return require("lz4-napi-linux-riscv64-gnu")}catch(r){loadErrors.push(r)}}else if(process.arch==="ppc64"){try{return require("./lz4-napi.linux-ppc64-gnu.node")}catch(r){loadErrors.push(r)}try{return require("lz4-napi-linux-ppc64-gnu")}catch(r){loadErrors.push(r)}}else if(process.arch==="s390x"){try{return require("./lz4-napi.linux-s390x-gnu.node")}catch(r){loadErrors.push(r)}try{return require("lz4-napi-linux-s390x-gnu")}catch(r){loadErrors.push(r)}}else loadErrors.push(new Error(`Unsupported architecture on Linux: ${process.arch}`));else loadErrors.push(new Error(`Unsupported OS: ${process.platform}, architecture: ${process.arch}`))}if(nativeBinding=requireNative(),!nativeBinding||process.env.NAPI_RS_FORCE_WASI){try{nativeBinding=require("./lz4-napi.wasi.cjs")}catch(r){process.env.NAPI_RS_FORCE_WASI&&loadErrors.push(r)}if(!nativeBinding)try{nativeBinding=require("lz4-napi-wasm32-wasi")}catch(r){process.env.NAPI_RS_FORCE_WASI&&loadErrors.push(r)}}if(!nativeBinding)throw loadErrors.length>0?new Error("Failed to load native binding",{cause:loadErrors}):new Error("Failed to load native binding");module.exports.compress=nativeBinding.compress,module.exports.compressFrame=nativeBinding.compressFrame,module.exports.compressSync=nativeBinding.compressSync,module.exports.decompressFrame=nativeBinding.decompressFrame,module.exports.uncompress=nativeBinding.uncompress,module.exports.uncompressSync=nativeBinding.uncompressSync;
