#!/bin/bash
set -euo pipefail

PROJECT_ROOT="/Users/janruske/Clarity"
DB_PATH="$PROJECT_ROOT/prisma/dev.db"
BACKUP_DIR="$PROJECT_ROOT/backups"

if [ ! -d "$BACKUP_DIR" ]; then
  echo "No backups directory found at $BACKUP_DIR" >&2
  echo "Creating fresh database with seed data..."
  cd "$PROJECT_ROOT"
  npx prisma db push
  npm run db:seed
  echo "Fresh database created and seeded!"
  exit 0
fi

latest=$(ls -t "$BACKUP_DIR"/dev-*.db 2>/dev/null | head -n1 || true)
if [ -z "$latest" ]; then
  echo "No .db backups found in $BACKUP_DIR" >&2
  echo "Creating fresh database with seed data..."
  cd "$PROJECT_ROOT"
  npx prisma db push
  npm run db:seed
  echo "Fresh database created and seeded!"
  exit 0
fi

# Test if the backup is valid before restoring
if ! sqlite3 "$latest" "SELECT 1;" >/dev/null 2>&1; then
  echo "Warning: Backup file $latest appears to be corrupted" >&2
  echo "Creating fresh database with seed data instead..."
  cd "$PROJECT_ROOT"
  npx prisma db push
  npm run db:seed
  echo "Fresh database created and seeded!"
  exit 0
fi

cp "$latest" "$DB_PATH"
echo "Restored $DB_PATH from $latest"

# Verify the restored database works
if ! sqlite3 "$DB_PATH" "SELECT 1;" >/dev/null 2>&1; then
  echo "Warning: Restored database appears to be corrupted" >&2
  echo "Creating fresh database with seed data..."
  cd "$PROJECT_ROOT"
  npx prisma db push
  npm run db:seed
  echo "Fresh database created and seeded!"
fi

