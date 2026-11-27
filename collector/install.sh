#!/bin/bash
# Installs the rxusage collector as a macOS LaunchAgent that runs every 5 minutes.
#
#   collector/install.sh https://your-site.pages.dev     install (URL required the first time) or update
#   collector/install.sh --uninstall                     remove the LaunchAgent (keeps the config)
#
# The script is copied to ~/Library/Application Support/rxusage because launchd jobs
# can't read ~/Desktop or ~/Documents without extra macOS permissions.
set -euo pipefail

LABEL="com.rxusage.collector"
APP_DIR="$HOME/Library/Application Support/rxusage"
CONFIG_DIR="$HOME/.config/rxusage"
CONFIG="$CONFIG_DIR/collector.json"
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"
LOG="$HOME/Library/Logs/rxusage-collector.log"
SRC="$(cd "$(dirname "$0")" && pwd)/rxusage-collector.mjs"

if [[ "${1:-}" == "--uninstall" ]]; then
  launchctl bootout "gui/$(id -u)/$LABEL" 2>/dev/null || true
  rm -f "$PLIST" "$APP_DIR/collector.mjs"
  echo "Removed $LABEL. Config kept at $CONFIG"
  exit 0
fi

NODE="$(command -v node || true)"
[[ -n "$NODE" ]] || { echo "node not found on PATH" >&2; exit 1; }

mkdir -p "$APP_DIR" "$CONFIG_DIR" "$(dirname "$PLIST")" "$(dirname "$LOG")"
cp "$SRC" "$APP_DIR/collector.mjs"

if [[ ! -f "$CONFIG" ]]; then
  URL="${1:-}"
  [[ -n "$URL" ]] || { echo "Usage: $0 https://your-site.pages.dev" >&2; exit 1; }
  TOKEN="$(openssl rand -hex 32)"
  (umask 077 && printf '{\n  "url": "%s",\n  "token": "%s"\n}\n' "$URL" "$TOKEN" > "$CONFIG")
  echo "Created $CONFIG (url: $URL)"
elif [[ -n "${1:-}" ]]; then
  "$NODE" -e 'const f=process.argv[1],c=JSON.parse(require("fs").readFileSync(f,"utf8"));c.url=process.argv[2];require("fs").writeFileSync(f,JSON.stringify(c,null,2)+"\n")' "$CONFIG" "$1"
  echo "Updated url in $CONFIG to $1"
fi
chmod 600 "$CONFIG"

cat > "$PLIST" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>$LABEL</string>
  <key>ProgramArguments</key>
  <array>
    <string>$NODE</string>
    <string>$APP_DIR/collector.mjs</string>
  </array>
  <key>StartInterval</key><integer>300</integer>
  <key>RunAtLoad</key><true/>
  <key>StandardOutPath</key><string>$LOG</string>
  <key>StandardErrorPath</key><string>$LOG</string>
</dict>
</plist>
EOF

launchctl bootout "gui/$(id -u)/$LABEL" 2>/dev/null || true
launchctl bootstrap "gui/$(id -u)" "$PLIST"

HASH="$("$NODE" -e 'const c=JSON.parse(require("fs").readFileSync(process.argv[1],"utf8"));console.log(require("crypto").createHash("sha256").update(c.token).digest("hex"))' "$CONFIG")"
cat <<EOF

Installed $LABEL (every 5 minutes). Log: $LOG

Set this in Cloudflare Pages → Settings → Variables and Secrets (Production):
  LIMITS_INGEST_TOKEN_SHA256 = $HASH
This is only a hash of the token; the token itself stays in $CONFIG.
EOF
