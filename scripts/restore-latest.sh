#!/bin/bash
set -euo pipefail

PROJECT_ROOT="/Users/janruske/Clarity"
DB_PATH="$PROJECT_ROOT/prisma/dev.db"
BACKUP_DIR="$PROJECT_ROOT/backups"

if [ ! -d "$BACKUP_DIR" ]; then
  echo "No backups directory found at $BACKUP_DIR" >&2
  exit 1
fi

latest=$(ls -t "$BACKUP_DIR"/dev-*.db 2>/dev/null | head -n1 || true)
if [ -z "$latest" ]; then
  echo "No .db backups found in $BACKUP_DIR" >&2
  exit 1
fi

cp "$latest" "$DB_PATH"
echo "Restored $DB_PATH from $latest"

