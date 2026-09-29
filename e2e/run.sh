#!/usr/bin/env bash
# Runs unit tests and the browser flows against a local static server.
# usage: bash e2e/run.sh      (from the repo root; needs python, node 22+, Chrome)
set -u
cd "$(dirname "$0")/.."
node tests.js | tail -1
python -m http.server 8765 --bind 127.0.0.1 >/dev/null 2>&1 &
SRV=$!
sleep 1
B="http://127.0.0.1:8765/index.html"
LOG="${TMPDIR:-${TEMP:-/tmp}}/arise-e2e"; mkdir -p "$LOG"
node e2e/cdp.js "$B?demo#workout"  "" 390 e2e/core-flow.js       > "$LOG/core.log" 2>&1 &
node e2e/cdp.js "$B#routines"      "" 390 e2e/load-and-ranges.js > "$LOG/load.log" 2>&1 &
node e2e/cdp.js "$B?demo&active#workout" "" 360 e2e/overflow.js > "$LOG/w360.log" 2>&1 &
node e2e/cdp.js "$B?demo#progress" "" 360 e2e/overflow.js        > "$LOG/p360.log" 2>&1 &
wait $(jobs -p | grep -v "^$SRV$") 2>/dev/null
for f in core load w360 p360; do echo "== $f"; grep -E "FAIL|passed|FAILED|CONSOLE|ok   no horizontal" "$LOG/$f.log" || tail -3 "$LOG/$f.log"; done
kill $SRV 2>/dev/null
