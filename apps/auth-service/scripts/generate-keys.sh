#!/bin/sh
# Gera par de chaves RS256 para o auth-service
# Uso: sh scripts/generate-keys.sh

mkdir -p keys
openssl genrsa -out keys/private.pem 2048
openssl rsa -in keys/private.pem -pubout -out keys/public.pem
echo "Chaves geradas em keys/private.pem e keys/public.pem"
