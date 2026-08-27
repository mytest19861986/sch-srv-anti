#!/bin/bash
set -e

# Create replication user on Primary
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE USER replicator WITH REPLICATION ENCRYPTED PASSWORD 'replicator_secret_pass';
    SELECT * FROM pg_create_physical_replication_slot('standby_slot_1');
EOSQL

echo "host replication replicator 0.0.0.0/0 md5" >> "$PGDATA/pg_hba.conf"
pg_ctl -D "$PGDATA" reload
