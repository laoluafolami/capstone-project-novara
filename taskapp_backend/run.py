from app import create_app, db
import os
import sys

app = create_app()

# Initialize database tables on startup (runs for both Gunicorn and Flask dev server)
try:
    with app.app_context():
        db.create_all()
        print("✓ Database tables initialized successfully", file=sys.stderr)
except Exception as e:
    print(f"✗ Error initializing database tables: {e}", file=sys.stderr)
    sys.exit(1)

# This block only runs when executing directly (not via Gunicorn)
if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('FLASK_ENV') == 'development'
    # Only use Flask dev server for local development
    app.run(host='0.0.0.0', port=port, debug=debug)