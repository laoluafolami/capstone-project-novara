#!/bin/bash
set -e

echo "Waiting for database to be ready..."
python -c "
import os
import time
import psycopg2
from psycopg2 import OperationalError

max_retries = 30
retry_count = 0

while retry_count < max_retries:
    try:
        conn = psycopg2.connect(
            host=os.getenv('DATABASE_HOST', 'localhost'),
            port=os.getenv('DATABASE_PORT', '5432'),
            database=os.getenv('DATABASE_NAME', 'taskapp'),
            user=os.getenv('DATABASE_USER', 'taskapp_user'),
            password=os.getenv('DATABASE_PASSWORD', 'taskapp_password')
        )
        conn.close()
        print('✓ Database is ready!')
        break
    except OperationalError:
        retry_count += 1
        if retry_count >= max_retries:
            print('✗ Database connection failed after 30 retries')
            exit(1)
        print(f'Database not ready, retrying... ({retry_count}/{max_retries})')
        time.sleep(1)
"

echo "Initializing database tables..."
python -c "
from app import create_app, db
app = create_app()
with app.app_context():
    db.create_all()
    print('✓ Database tables initialized')
"

echo "Starting Gunicorn..."
exec gunicorn --bind 0.0.0.0:5000 --workers 2 --timeout 120 run:app
