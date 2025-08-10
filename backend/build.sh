#!/usr/bin/env sh
set -eux

# Clean previous builds
rm -rf dist package.zip
rm -f requirements.txt

# Install dependencies into a temporary directory
poetry export --without-hashes --format=requirements.txt > requirements.txt
pip install --platform manylinux2014_x86_64 \
            --only-binary=:all: \
            --implementation cp \
            --python 3.11 \
            -r requirements.txt -t dist/

# Remove dep
ROOT="dist"

find "$ROOT" -type d -name "__pycache__" -prune -exec rm -rf {} +
find "$ROOT" -type d -name ".pytest_cache" -prune -exec rm -rf {} +
find "$ROOT" -type f \( -name "*.pyc" -o -name "*.pyo" \) -delete

find "$ROOT" -type d \( -name "tests" -o -name "test" -o -name "testing" -o -name "examples" \) -prune -exec rm -rf {} +

find "$ROOT" -path "*/googleapiclient/discovery_cache" -type d -prune -exec rm -rf {} +

find "$ROOT" -maxdepth 2 -type f -name "*.whl" -delete

# Copy source code into the dist directory
cp -r -v app/* dist

# Create ZIP package for Lambda
cd dist && zip -r ../lambda_package.zip . && cd ..

echo "Lambda package created as lambda_package.zip"
