from flask import request, jsonify
from functools import wraps
import jwt
import os
from app.models import User
from werkzeug.security import check_password_hash
# Get secret key from environment variable or use default for development
SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')

def generate_token(user_id, username):
    payload = {
        'user_id': user_id,
        'username': username
    }
    return jwt.encode(payload, SECRET_KEY, algorithm='HS256')

def verify_token(token):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        return payload
    except (jwt.InvalidTokenError, jwt.DecodeError):
        return None

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None

        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(" ")[1]
            except IndexError:
                return jsonify({'error': 'Invalid token format'}), 401

        if not token:
            return jsonify({'error': 'Token is missing'}), 401

        payload = verify_token(token)
        if not payload:
            return jsonify({'error': 'Invalid or expired token'}), 401

        request.user_id = payload.get('user_id')
        request.username = payload.get('username')

        return f(*args, **kwargs)

    return decorated

def login_user(username, password):
    user = User.query.filter_by(username=username).first()

    if not user:
        return None, 'Invalid username or password'

    if not check_password_hash(user.password_hash, password):
        return None, 'Invalid username or password'

    token = generate_token(user.id, user.username)
    return {
        'token': token,
        'user': user.to_dict()
    }, None

__all__ = ['generate_token', 'verify_token', 'token_required', 'login_user']
