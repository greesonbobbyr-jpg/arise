#!/usr/bin/env bash
# Runs unit tests and the browser flows against a local static server.
# usage: bash e2e/run.sh            all flows
#        bash e2e/run.sh tiers sys  only the named flows
# (from the repo root; needs python, node 22+, Chrome)
# Flows run two at a time: python's http.server drops requests when six browsers hit it at once.
# A flow whose browser stalls (driver exit code 3, usually a busy machine) is retried once.
set -u
cd "$(dirname "$0")/.."
node tests.js | tail -1
python -m http.server 8765 --bind 127.0.0.1 >/dev/null 2>&1 &
SRV=$!
sleep 1
B="http://127.0.0.1:8765/index.html"
LOG="${TMPDIR:-${TEMP:-/tmp}}/arise-e2e"; mkdir -p "$LOG"; rm -f "$LOG"/*.log
# name|url|width|steps file
FLOWS=(
  "core|$B?demo#workout|390|core-flow"
  "load|$B#routines|390|load-and-ranges"
  "prog|$B#routines|390|program-update"
  "sys|$B?demo&sealed#workout|390|system-reveal"
  "tiers|$B?demo#progress|390|tiers-and-shadow"
  "cal|$B?demo#calendar|390|calendar"
  "c360|$B?demo#calendar|360|overflow"
  "w360|$B?demo&active#workout|360|overflow"
  "p360|$B?demo#progress|360|overflow"
)
RUN=()
for f in "${FLOWS[@]}"; do
  name="${f%%|*}"
  if [ $# -eq 0 ]; then RUN+=("$f"); else for want in "$@"; do [ "$want" = "$name" ] && RUN+=("$f"); done; fi
done
flow() {
  IFS='|' read -r name url width steps <<< "$1"
  node e2e/cdp.js "$url" "" "$width" "e2e/$steps.js" > "$LOG/$name.log" 2>&1
  if [ $? -eq 3 ]; then
    echo "(browser stalled, retrying once)" > "$LOG/$name.retry"
    node e2e/cdp.js "$url" "" "$width" "e2e/$steps.js" > "$LOG/$name.log" 2>&1
  fi
}
i=0
while [ $i -lt ${#RUN[@]} ]; do
  flow "${RUN[$i]}" & a=$!
  if [ $((i + 1)) -lt ${#RUN[@]} ]; then flow "${RUN[$((i + 1))]}" & b=$!; wait $a $b; else wait $a; fi
  i=$((i + 2))
done
for f in "${RUN[@]}"; do
  name="${f%%|*}"; echo "== $name$( [ -f "$LOG/$name.retry" ] && echo ' (retried after a browser stall)')"
  grep -E "FAIL|passed|FAILED|CONSOLE|STALLED|ok   no horizontal" "$LOG/$name.log" || tail -3 "$LOG/$name.log"
done
rm -f "$LOG"/*.retry
kill $SRV 2>/dev/null
