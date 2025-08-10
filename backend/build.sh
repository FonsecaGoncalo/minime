#!/usr/bin/env bash
set -euo pipefail

ARCH="${ARCH:-x86_64}"   # or aarch64
PYVER=3.11
LAMBDA_IMG="public.ecr.aws/lambda/python:${PYVER}"

# Clean
rm -rf dist lambda_package.zip requirements.txt

# Export requirements
poetry export --without-hashes --format=requirements.txt > requirements.txt

# Build inside Lambda container so wheels match the runtime
docker run --rm -v "$PWD":/var/task -w /var/task "$LAMBDA_IMG" /bin/bash -lc "
  set -euo pipefail
  python -m pip install --upgrade pip
  rm -rf dist && mkdir -p dist
  # Install wheels into dist (Linux, correct glibc, correct ABI)
  pip install \
    --only-binary=:all: \
    --upgrade \
    --no-cache-dir \
    -r requirements.txt -t dist/
"

# Prune junk
ROOT="dist"
find "$ROOT" -type d -name "__pycache__" -prune -exec rm -rf {} +
find "$ROOT" -type d -name ".pytest_cache" -prune -exec rm -rf {} +
find "$ROOT" -type f \( -name "*.pyc" -o -name "*.pyo" \) -delete
find "$ROOT" -type d \( -name "tests" -o -name "test" -o -name "testing" -o -name "examples" \) -prune -exec rm -rf {} +
find "$ROOT" -path "*/googleapiclient/discovery_cache" -type d -prune -exec rm -rf {} +
find "$ROOT" -maxdepth 2 -type f -name "*.whl" -delete

# Copy your code
cp -rv app/* dist/

# Zip
cd dist && zip -r ../lambda_package.zip . && cd -
echo 'Lambda package created as lambda_package.zip'
