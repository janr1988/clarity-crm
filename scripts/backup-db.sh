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
  echo "Creating fresh database with seed data..."
  cd "$PROJECT_ROOT"
  npx prisma db push
  npm run db:seed
  echo "Fresh database created and seeded!"
fi

# Fast filesystem copy
cp "$DB_PATH" "$snapshot_db"

# SQLite online backup for integrity (with error handling)
if ! sqlite3 "$DB_PATH" ".backup '$snapshot_sqlite'"; then
  echo "Warning: SQLite backup failed, but filesystem copy succeeded" >&2
  echo "Database might be corrupted. Consider running: npm run db:seed" >&2
fi

echo "Backup created:"
echo " - $snapshot_db"
echo " - $snapshot_sqlite"

# Keep only last 10 backups to save space
cd "$BACKUP_DIR"
ls -t dev-*.db | tail -n +11 | xargs -r rm -f
ls -t dev-*.sqlite | tail -n +11 | xargs -r rm -f

