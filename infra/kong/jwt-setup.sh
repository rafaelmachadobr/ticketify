#!/bin/sh
set -e

KONG_ADMIN="${KONG_ADMIN_URL:-http://kong:8001}"
KEY_FILE="/keys/public.pem"
ISSUER="ticketify"
CONSUMER="ticketify-issuer"

echo "[kong-jwt-setup] Waiting for Kong Admin API..."
until wget -qO- "$KONG_ADMIN/status" > /dev/null 2>&1; do
  sleep 2
done

echo "[kong-jwt-setup] Reading public key from $KEY_FILE"
PUBLIC_KEY=$(cat "$KEY_FILE")

echo "[kong-jwt-setup] Ensuring consumer '$CONSUMER' exists..."
wget -qO- --post-data="username=$CONSUMER" "$KONG_ADMIN/consumers" > /dev/null 2>&1 || true

echo "[kong-jwt-setup] Checking for existing JWT credential..."
EXISTING=$(wget -qO- "$KONG_ADMIN/consumers/$CONSUMER/jwt" 2>/dev/null)
COUNT=$(echo "$EXISTING" | grep -c "\"key\":\"$ISSUER\"" || true)

if [ "$COUNT" -gt "0" ]; then
  echo "[kong-jwt-setup] Credential for iss='$ISSUER' already exists — updating public key..."
  CRED_ID=$(echo "$EXISTING" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  wget -qO- --method=PATCH \
    --header="Content-Type: application/json" \
    --body-data="{\"rsa_public_key\":$(echo "$PUBLIC_KEY" | awk 'BEGIN{printf "\""} {printf "%s\\n", $0} END{printf "\""}')}" \
    "$KONG_ADMIN/consumers/$CONSUMER/jwt/$CRED_ID" > /dev/null
else
  echo "[kong-jwt-setup] Creating RS256 credential for iss='$ISSUER'..."
  wget -qO- \
    --header="Content-Type: application/json" \
    --post-data="{\"key\":\"$ISSUER\",\"algorithm\":\"RS256\",\"rsa_public_key\":$(echo "$PUBLIC_KEY" | awk 'BEGIN{printf "\""} {printf "%s\\n", $0} END{printf "\""}')}" \
    "$KONG_ADMIN/consumers/$CONSUMER/jwt" > /dev/null
fi

echo "[kong-jwt-setup] Done. Kong JWT RS256 configured for iss='$ISSUER'."
