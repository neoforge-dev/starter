#!/bin/bash
set -e

# Create test database with proper collation
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    DROP DATABASE IF EXISTS test_db;
    CREATE DATABASE test_db WITH ENCODING 'UTF8' LC_COLLATE='en_US.utf8' LC_CTYPE='en_US.utf8' TEMPLATE=template0;
    GRANT ALL PRIVILEGES ON DATABASE test_db TO $POSTGRES_USER;
EOSQL

echo "Test database created successfully with proper collation settings." 