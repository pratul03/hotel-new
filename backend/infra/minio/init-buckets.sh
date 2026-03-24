#!/bin/bash

# This script is called after MinIO container starts
# Creates the required buckets

set -e

# MinIO client alias setup would go here
# For now, buckets are created on first API call

echo "MinIO container started. Buckets will be created on first API usage."
