#!/usr/bin/env bash
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/var/backups/serviceyar}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DB_CONTAINER="serviceyar_pg_primary_prod"
DB_NAME="${DB_NAME:-school_transport}"
DB_USER="${DB_USER:-school_user}"
RETENTION_DAYS=14

mkdir -p "$BACKUP_DIR"

BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_backup_${TIMESTAMP}.sql.gz"

echo "📦 [Database Backup] Starting pg_dump for $DB_NAME..."

docker exec "$DB_CONTAINER" pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$BACKUP_FILE"

echo "✅ Backup created successfully: $BACKUP_FILE ($(du -h "$BACKUP_FILE" | cut -f1))"

# Retention cleanup
find "$BACKUP_DIR" -type f -name "${DB_NAME}_backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete
echo "🧹 Old backups older than $RETENTION_DAYS days cleaned up."
