#!/usr/bin/env bash
# Smoke test for the Docker stack (docker/compose.yml): every service answers, a new organization
# signs up through the admin's /api proxy, its storefront answers on <slug>.localhost and the
# verification email reaches Mailpit.  Usage: bash e2e/stack/stack-smoke.sh
set -euo pipefail
ADMIN=${ADMIN:-http://127.0.0.1:8080}
API=${API:-http://127.0.0.1:4000}
WEB=${WEB:-http://127.0.0.1:3000}
MAILPIT=${MAILPIT:-http://127.0.0.1:8025}
fail=0
ok() { echo "OK   $1"; }
bad() { echo "FAIL $1"; fail=1; }

echo "waiting for the stack..."
for i in $(seq 1 90); do
  curl -sf "$API/api/v1/health/ready" >/dev/null && curl -sf "$WEB/api/health" >/dev/null && curl -sf "$ADMIN/" >/dev/null && break
  sleep 2
  [ "$i" = 90 ] && { echo "stack did not become ready"; exit 1; }
done

curl -sf "$API/api/v1/health/ready" | grep -q '"ok"\|"status"' && ok "API ready (PostgreSQL + Redis)" || bad "API ready"

h=$(curl -sI "$ADMIN/")
grep -qi "content-security-policy: default-src 'self'" <<<"$h" && ok "admin serves the SPA with a strict CSP" || bad "admin CSP"
curl -sf "$ADMIN/some/deep/link" | grep -qi "<sv-root\|<app-root\|<base" && ok "admin SPA fallback" || bad "admin SPA fallback"

paths=$(curl -sf "$ADMIN/api/v1/openapi.json" | grep -o '"/[a-z0-9/{}_-]*":' | wc -l)
[ "$paths" -ge 30 ] && ok "OpenAPI through the admin proxy ($paths paths)" || bad "OpenAPI ($paths paths)"

email="smoke-$(date +%s)@stack.local"
org="Stack Smoke $(date +%s)"
code=$(curl -s -o /tmp/signup.json -w '%{http_code}' -H 'Content-Type: application/json' -H 'X-Requested-With: x' \
  -d "{\"email\":\"$email\",\"password\":\"stack-smoke-password-1\",\"name\":\"Smoke\",\"organizationName\":\"$org\"}" \
  "$ADMIN/api/v1/auth/signup")
token=$(grep -o '"accessToken":"[^"]*' /tmp/signup.json | cut -d'"' -f4 || true)
slug=$(curl -sf -H "Authorization: Bearer $token" "$ADMIN/api/v1/auth/me" | grep -o '"slug":"[a-z0-9-]*"' | head -1 | cut -d'"' -f4 || true)
[ "$code" = 201 ] && [ -n "$slug" ] && ok "sign-up through the admin proxy (organization $slug)" || bad "sign-up: HTTP $code $(head -c 300 /tmp/signup.json)"

loc=$(curl -s -o /dev/null -w '%{redirect_url}' -H "Host: $slug.localhost:3000" -H 'Accept-Language: ru' "$WEB/")
[[ "$loc" == */ru ]] && ok "storefront sends a Russian browser to /ru" || bad "storefront redirect: $loc"
page=$(curl -s -D /tmp/web.h -H "Host: $slug.localhost:3000" "$WEB/en")
grep -q "$org" <<<"$page" && ok "storefront shows the organization on $slug.localhost" || bad "storefront page"
grep -qi "content-security-policy:.*nonce-" /tmp/web.h && ok "storefront sends a nonce CSP" || bad "storefront CSP"
curl -s -H "Host: nobody.localhost:3000" "$WEB/en" | grep -q "There is no shop at this address" && ok "unknown storefront host shows the no-shop page" || bad "unknown host page"

for i in $(seq 1 15); do
  curl -sf "$MAILPIT/api/v1/search?query=to:$email" | grep -q '"total":[1-9]' && break
  sleep 2
done
curl -sf "$MAILPIT/api/v1/search?query=to:$email" | grep -q '"total":[1-9]' && ok "verification email delivered (Mailpit)" || bad "verification email"

[ "$fail" = 0 ] && echo "ALL PASSED" || { echo "FAILED"; exit 1; }
