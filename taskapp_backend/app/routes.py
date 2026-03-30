from flask import Blueprint, request, jsonify
from app import db
from app.models import Task, User
from app.auth import token_required, login_user, generate_token
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
from sqlalchemy import text

api_bp = Blueprint('api', __name__)

@api_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint for load balancers and monitoring."""
    try:
        # Check database connection
        db.session.execute(text('SELECT 1'))
        return jsonify({
            'status': 'healthy',
            'database': 'connected',
            'timestamp': datetime.utcnow().isoformat()
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'database': str(e),
            'timestamp': datetime.utcnow().isoformat()
        }), 503


@api_bp.route('/auth/login', methods=['POST'])
def login():
    data = request.get_json()

    if not data or 'username' not in data or 'password' not in data:
        return jsonify({'error': 'Username and password are required'}), 400

    result, error = login_user(data['username'], data['password'])

    if error:
        return jsonify({'error': error}), 401

    return jsonify(result), 200

@api_bp.route('/tasks', methods=['GET'])
@token_required
def get_tasks():
    try:
        tasks = Task.query.order_by(Task.created_at.desc()).all()
        return jsonify([task.to_dict() for task in tasks]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api_bp.route('/tasks', methods=['POST'])
@token_required
def create_task():
    try:
        data = request.get_json()

        if not data or 'title' not in data:
            return jsonify({'error': 'Title is required'}), 400

        task = Task(
            title=data['title'],
            description=data.get('description', ''),
            priority=data.get('priority', 'medium'),
            status=data.get('status', 'todo')
        )

        db.session.add(task)
        db.session.commit()

        return jsonify(task.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@api_bp.route('/tasks/<int:task_id>', methods=['PUT'])
@token_required
def update_task(task_id):
    try:
        task = Task.query.get(task_id)

        if not task:
            return jsonify({'error': 'Task not found'}), 404

        data = request.get_json()

        if 'title' in data:
            task.title = data['title']
        if 'description' in data:
            task.description = data['description']
        if 'priority' in data:
            task.priority = data['priority']
        if 'status' in data:
            task.status = data['status']

        db.session.commit()

        return jsonify(task.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@api_bp.route('/tasks/<int:task_id>', methods=['DELETE'])
@token_required
def delete_task(task_id):
    try:
        task = Task.query.get(task_id)

        if not task:
            return jsonify({'error': 'Task not found'}), 404

        db.session.delete(task)
        db.session.commit()

        return jsonify({'message': 'Task deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@api_bp.route('/auth/signup', methods=['POST'])
def signup():
    try:
        data = request.get_json()

        if not data or 'username' not in data or 'password' not in data:
            return jsonify({'error': 'Username and password are required'}), 400

        # Check if user already exists
        existing_user = User.query.filter_by(username=data['username']).first()
        if existing_user:
            return jsonify({'error': 'Username already exists'}), 409

        # Create new user
        hashed_password = generate_password_hash(data['password'])
        new_user = User(username=data['username'], password_hash=hashed_password)
        
        db.session.add(new_user)
        db.session.commit()

        # Generate token for immediate login
        token = generate_token(new_user.id, new_user.username)
        
        return jsonify({
            'message': 'User created successfully',
            'token': token,
            'user': new_user.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
