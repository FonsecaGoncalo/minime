#!/usr/bin/env sh
set -eux

# Clean previous builds
rm -rf dist package.zip
rm -f requirements.txt

# Install dependencies into a temporary directory
poetry export --without-hashes --format=requirements.txt > requirements.txt
pip install -r requirements.txt -t dist/

# Remove dep
find dist -path "*/googleapiclient/discovery_cache" -type d -exec rm -rf {} +
find dist -type d -name "__pycache__" -exec rm -rf {} +
find dist -type d \( -name "tests" -o -name "test" -o -name "testing" -o -name "examples" \) -exec rm -rf {} +
find dist -type d -name ".pytest_cache" -exec rm -rf {} +
find dist -type f \( -name "*.pyc" -o -name "*.pyo" -o -name "*.whl" \) -delete
find dist -type d -name "discovery_cache" -exec rm -rf {} +
find dist -type f \( -name "README*" -o -name "CHANGELOG*" -o -name "LICENSE*" \) -delete


# Copy source code into the dist directory
cp -r -v app/* dist

# Create ZIP package for Lambda
cd dist && zip -r ../lambda_package.zip . && cd ..

echo "Lambda package created as lambda_package.zip"
