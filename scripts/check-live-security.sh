#!/usr/bin/env bash
# Checks the live site against what the config says it should be (Session D:
# "Is it still right now?"). The nginx file in terraform/nginx is a reference
# copy edited by hand on a shared server — this is what notices when the real
# server drifts from it: a renewal script rewriting headers, an update
# re-enabling an old TLS version, a certificate about to lapse.
#
# Usage: scripts/check-live-security.sh [https://selfinder.online]
# Exit 1 if any check fails. Runs daily in .github/workflows/live-security-check.yml.

set -uo pipefail
BASE="${1:-https://selfinder.online}"
HOST="${BASE#https://}"; HOST="${HOST%%/*}"
failures=0

pass() { printf '  ok    %s\n' "$1"; }
fail() { printf '  FAIL  %s\n' "$1"; failures=$((failures + 1)); }
warn() { printf '  warn  %s\n' "$1"; }

header() { # header <name> <headers-blob>
  printf '%s\n' "$2" | tr -d '\r' | grep -i "^$1:" | head -1 | cut -d: -f2- | sed 's/^ *//'
}

echo "Checking $BASE"

page="$(curl -sS -D - -o /dev/null --max-time 20 "$BASE/")" || { echo "  FAIL  site unreachable"; exit 1; }
api="$(curl -sS -D - -o /dev/null --max-time 20 "$BASE/api/health")"

echo "Headers"
hsts="$(header Strict-Transport-Security "$page")"
age="$(printf '%s' "$hsts" | sed -n 's/.*max-age=\([0-9]*\).*/\1/p')"
[ "${age:-0}" -ge 31536000 ] && pass "HSTS max-age is at least a year" || fail "HSTS max-age missing or under a year: '$hsts'"
printf '%s' "$hsts" | grep -qi includeSubDomains && pass "HSTS covers subdomains" || fail "HSTS lacks includeSubDomains"

csp="$(header Content-Security-Policy "$page")"; mode="enforcing"
[ -z "$csp" ] && { csp="$(header Content-Security-Policy-Report-Only "$page")"; mode="report-only"; }
if [ -z "$csp" ]; then
  fail "no Content-Security-Policy"
else
  pass "CSP present ($mode)"
  script_src="$(printf '%s' "$csp" | tr ';' '\n' | grep -i 'script-src' || true)"
  printf '%s' "$script_src" | grep -qiE "unsafe-inline|unsafe-eval|\*" \
    && fail "CSP script-src allows inline/eval/wildcards: $script_src" || pass "CSP script-src has no unsafe-inline, unsafe-eval or wildcard"
  printf '%s' "$csp" | grep -qi "object-src 'none'" && pass "CSP blocks plugins (object-src 'none')" || fail "CSP lacks object-src 'none'"
  [ "$mode" = "report-only" ] && warn "CSP is report-only — switch to enforcing once reports are clean"
fi

[ "$(header X-Content-Type-Options "$page")" = "nosniff" ] && pass "X-Content-Type-Options: nosniff" || fail "missing X-Content-Type-Options: nosniff"
xfo="$(header X-Frame-Options "$page")"
{ [ "$xfo" = "DENY" ] || printf '%s' "$csp" | grep -qi "frame-ancestors 'none'"; } && pass "framing blocked (clickjacking)" || fail "page can be framed"

echo "Banners"
for target in "page:$page" "api:$api"; do
  name="${target%%:*}"; blob="${target#*:}"
  server="$(header Server "$blob")"
  printf '%s' "$server" | grep -q '[0-9]' && fail "$name Server header reveals a version: '$server'" || pass "$name Server header has no version ('${server:-none}')"
  [ -z "$(header X-Powered-By "$blob")" ] && pass "$name sends no X-Powered-By" || fail "$name sends X-Powered-By: $(header X-Powered-By "$blob")"
done

echo "Exposure"
redirect="$(curl -sS -o /dev/null -w '%{http_code} %{redirect_url}' --max-time 20 "http://$HOST/")"
case "$redirect" in 301\ https://*|308\ https://*) pass "plain HTTP redirects to HTTPS";; *) fail "plain HTTP doesn't redirect to HTTPS: $redirect";; esac
for path in /metrics /api/metrics; do
  body="$(curl -sS --max-time 20 "$BASE$path" | head -c 2000)"
  printf '%s' "$body" | grep -q "^# HELP" && fail "$path exposes Prometheus metrics publicly" || pass "$path doesn't expose metrics"
done

echo "TLS"
probe() { # probe <openssl flag> → "accepted" | "refused" | "untestable"
  # SECLEVEL=0 lets this client *offer* old versions, so a refusal is the
  # server's answer and not just this machine's OpenSSL declining to try.
  out="$(echo | openssl s_client -connect "$HOST:443" -servername "$HOST" "$1" -cipher 'DEFAULT:@SECLEVEL=0' 2>&1 </dev/null)"
  if printf '%s' "$out" | grep -qi "alert protocol version"; then echo refused     # the server said no (alert 70)
  elif printf '%s' "$out" | grep -q "Cipher is (NONE)"; then echo refused         # handshake reached the server, nothing agreed
  elif printf '%s' "$out" | grep -q "Cipher is [A-Z0-9]"; then echo accepted      # a real session was negotiated
  else echo untestable                                                           # e.g. "no protocols available" on this client
  fi
}
for v in tls1_3 tls1_2; do
  [ "$(probe -$v)" = accepted ] && pass "$v accepted" || fail "$v not accepted"
done
for v in tls1 tls1_1; do
  case "$(probe -$v)" in
    refused) pass "$v refused" ;;
    accepted) fail "$v still accepted — legacy versions must be disabled, not just deprioritised" ;;
    *) warn "$v couldn't be offered by this machine's OpenSSL — not tested" ;;
  esac
done

expiry="$(echo | openssl s_client -connect "$HOST:443" -servername "$HOST" 2>/dev/null | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)"
if [ -n "$expiry" ]; then
  end="$(date -d "$expiry" +%s 2>/dev/null || date -j -f '%b %e %T %Y %Z' "$expiry" +%s 2>/dev/null)"
  days=$(( (end - $(date +%s)) / 86400 ))
  [ "$days" -ge 14 ] && pass "certificate valid for $days more days" || fail "certificate expires in $days days ($expiry)"
else
  fail "couldn't read the certificate"
fi

echo
if [ "$failures" -gt 0 ]; then echo "$failures check(s) failed"; exit 1; fi
echo "All checks passed"
