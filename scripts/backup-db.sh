#!/bin/bash
set -euo pipefail

# Project root absolute path is required for reliability
PROJECT_ROOT="/Users/janruske/Clarity"
DB_PATH="$PROJECT_ROOT/prisma/dev.db"
BACKUP_DIR="$PROJECT_ROOT/backups"

mkdir -p "$BACKUP_DIR"

timestamp=$(date +"%Y%m%d-%H%M%S")
snapshot_db="$BACKUP_DIR/dev-$timestamp.db"
snapshot_sqlite="$BACKUP_DIR/dev-$timestamp.sqlite"

if [ ! -f "$DB_PATH" ]; then
  echo "Database not found at $DB_PATH" >&2
  exit 1
fi

# Fast filesystem copy
cp "$DB_PATH" "$snapshot_db"

# SQLite online backup for integrity
sqlite3 "$DB_PATH" ".backup '$snapshot_sqlite'"

echo "Backup created:"
echo " - $snapshot_db"
echo " - $snapshot_sqlite"

