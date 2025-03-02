FROM postgres:15-alpine

# Set environment variables for locale
ENV LANG=en_US.utf8
ENV LC_COLLATE=en_US.utf8
ENV LC_CTYPE=en_US.utf8

# Install required packages for locale support
RUN apk add --no-cache icu-libs

# Set PostgreSQL configuration
RUN echo "max_connections = 100" >> /usr/local/share/postgresql/postgresql.conf.sample && \
    echo "shared_buffers = 256MB" >> /usr/local/share/postgresql/postgresql.conf.sample && \
    echo "client_encoding = 'UTF8'" >> /usr/local/share/postgresql/postgresql.conf.sample && \
    echo "default_text_search_config = 'pg_catalog.english'" >> /usr/local/share/postgresql/postgresql.conf.sample

# Create a directory for initialization scripts
RUN mkdir -p /docker-entrypoint-initdb.d

# Add initialization script to create test database with proper collation
COPY ./init-test-db.sh /docker-entrypoint-initdb.d/

# Make the script executable
RUN chmod +x /docker-entrypoint-initdb.d/init-test-db.sh 