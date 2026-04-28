#!/usr/bin/env sh
# Send a plain-text message to a Telegram chat (bot API).
# Usage:
#   export TELEGRAM_BOT_TOKEN="..."
#   export TELEGRAM_CHAT_ID="..."
#   ./scripts/telegram_notify.sh "Your alert text"
#
# Optional: pass message as stdin
#   echo "CPU high" | ./scripts/telegram_notify.sh

set -eu

TOKEN="${TELEGRAM_BOT_TOKEN:-}"
CHAT_ID="${TELEGRAM_CHAT_ID:-}"

if [ -z "$TOKEN" ] || [ -z "$CHAT_ID" ]; then
  echo "telegram_notify.sh: set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID" >&2
  exit 1
fi

if [ "${1-}" != "" ]; then
  MSG="$1"
else
  MSG=$(cat)
fi

if [ -z "$MSG" ]; then
  echo "telegram_notify.sh: empty message" >&2
  exit 1
fi

curl -sS -X POST "https://api.telegram.org/bot${TOKEN}/sendMessage" \
  --data-urlencode "chat_id=${CHAT_ID}" \
  --data-urlencode "text=${MSG}" \
  --data-urlencode "disable_web_page_preview=true" \
  | cat
