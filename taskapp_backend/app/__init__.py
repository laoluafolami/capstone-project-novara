from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import os
from urllib.parse import quote_plus

db = SQLAlchemy()

def create_app():
    app = Flask(__name__)

    # Get database connection details from environment
    db_host = os.getenv('DATABASE_HOST')
    db_port = os.getenv('DATABASE_PORT', '5432')
    db_name = os.getenv('DATABASE_NAME')
    db_user = os.getenv('DATABASE_USER')
    db_password = os.getenv('DATABASE_PASSWORD')

    if db_host and db_user and db_name and db_password:
        encoded_password = quote_plus(db_password)
        database_uri = (
            f"postgresql://{db_user}:{encoded_password}@{db_host}:{db_port}/{db_name}"
        )
    else:
        database_uri = 'postgresql://taskapp_user:taskapp_password@localhost:5432/taskapp'

    app.config['SQLALCHEMY_DATABASE_URI'] = database_uri
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')

    db.init_app(app)
    CORS(app)

    from app.routes import api_bp
    app.register_blueprint(api_bp, url_prefix='/api')

    return app