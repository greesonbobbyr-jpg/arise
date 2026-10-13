#!/usr/bin/env bash
# Runs unit tests and the browser flows against a local static server.
# usage: bash e2e/run.sh      (from the repo root; needs python, node 22+, Chrome)
# Flows run two at a time: python's http.server drops requests when six browsers hit it at once.
set -u
cd "$(dirname "$0")/.."
node tests.js | tail -1
python -m http.server 8765 --bind 127.0.0.1 >/dev/null 2>&1 &
SRV=$!
sleep 1
B="http://127.0.0.1:8765/index.html"
LOG="${TMPDIR:-${TEMP:-/tmp}}/arise-e2e"; mkdir -p "$LOG"; rm -f "$LOG"/*.log
flow() { node e2e/cdp.js "$1" "" "$2" "e2e/$3.js" > "$LOG/$4.log" 2>&1; }
pair() { flow "$1" "$2" "$3" "$4" & local a=$!; flow "$5" "$6" "$7" "$8" & local b=$!; wait $a $b; }
pair "$B?demo#workout" 390 core-flow core              "$B#routines" 390 load-and-ranges load
pair "$B#routines" 390 program-update prog             "$B?demo&sealed#workout" 390 system-reveal sys
pair "$B?demo&active#workout" 360 overflow w360        "$B?demo#progress" 360 overflow p360
for f in core load prog sys w360 p360; do echo "== $f"; grep -E "FAIL|passed|FAILED|CONSOLE|ok   no horizontal" "$LOG/$f.log" || tail -3 "$LOG/$f.log"; done
kill $SRV 2>/dev/null
