#!/usr/bin/env sh
set -eux

# Clean previous builds
rm -rf dist package.zip
rm -f requirements.txt

# Install dependencies into a temporary directory
poetry export --without-hashes --format=requirements.txt > requirements.txt
pip install -r requirements.txt -t dist/

# Copy source code into the dist directory
cp -r -v app/* dist

# Create ZIP package for Lambda
cd dist && zip -r ../lambda_package.zip . && cd ..

echo "Lambda package created as lambda_package.zip"
