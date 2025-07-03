#!/bin/bash

# Manual publishing script for @anglinb/lz4-napi
# Use this if GitHub Actions CI fails

echo "Manual publishing script for @anglinb/lz4-napi"
echo "============================================"
echo ""

# Check if logged in to npm
echo "Checking npm login status..."
npm whoami || { echo "Please login to npm first: npm login"; exit 1; }

echo ""
echo "Building the project..."
yarn build || { echo "Build failed!"; exit 1; }

# Copy the built artifact to the appropriate npm directory
echo ""
echo "Copying built artifacts..."
CURRENT_PLATFORM=""
if [[ "$OSTYPE" == "darwin"* ]]; then
  if [[ $(uname -m) == "arm64" ]]; then
    CURRENT_PLATFORM="darwin-arm64"
  else
    CURRENT_PLATFORM="darwin-x64"
  fi
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
  if [[ $(uname -m) == "x86_64" ]]; then
    CURRENT_PLATFORM="linux-x64-gnu"
  elif [[ $(uname -m) == "aarch64" ]]; then
    CURRENT_PLATFORM="linux-arm64-gnu"
  fi
fi

if [[ -n "$CURRENT_PLATFORM" ]] && [[ -f "lz4-napi.$CURRENT_PLATFORM.node" ]]; then
  echo "Found artifact for $CURRENT_PLATFORM"
  cp "lz4-napi.$CURRENT_PLATFORM.node" "npm/$CURRENT_PLATFORM/" || echo "Warning: Failed to copy artifact"
else
  echo "Warning: No artifact found for current platform"
fi

echo ""
echo "NOTE: This script only publishes the artifact for your current platform ($CURRENT_PLATFORM)."
echo "For full cross-platform publishing, use GitHub Actions CI."

echo ""
echo "Publishing platform-specific packages..."
echo "======================================="

# Array of all platform packages
platforms=(
  "android-arm-eabi"
  "android-arm64"
  "darwin-arm64"
  "darwin-x64"
  "freebsd-x64"
  "linux-arm-gnueabihf"
  "linux-arm64-gnu"
  "linux-arm64-musl"
  "linux-x64-gnu"
  "linux-x64-musl"
  "win32-arm64-msvc"
  "win32-ia32-msvc"
  "win32-x64-msvc"
)

# Publish each platform package
for platform in "${platforms[@]}"; do
  echo ""
  echo "Publishing @anglinb/lz4-napi-$platform..."
  cd "npm/$platform"
  npm publish --access public || echo "Warning: Failed to publish $platform (may already exist)"
  cd ../..
done

echo ""
echo "Running prepublishOnly script..."
yarn prepublishOnly || { echo "prepublishOnly failed!"; exit 1; }

echo ""
echo "Publishing main package @anglinb/lz4-napi..."
npm publish --access public || { echo "Failed to publish main package!"; exit 1; }

echo ""
echo "✅ Publishing complete!"
echo ""
echo "Verify your packages at:"
echo "https://www.npmjs.com/package/@anglinb/lz4-napi"