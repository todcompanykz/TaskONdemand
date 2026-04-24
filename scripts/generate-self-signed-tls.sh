#!/usr/bin/env bash
set -euo pipefail

mkdir -p infra/nginx/ssl

openssl req -x509 -nodes -days 365 \
  -newkey rsa:2048 \
  -keyout infra/nginx/ssl/server.key \
  -out infra/nginx/ssl/server.crt \
  -subj "/C=KZ/ST=Astana/L=Astana/O=TaskOnDemand/OU=Dev/CN=localhost"

echo "Generated:"
echo " - infra/nginx/ssl/server.crt"
echo " - infra/nginx/ssl/server.key"
