import pytest
from app.models import User
from werkzeug.security import generate_password_hash

def test_health_check(client):
    """Test health endpoint."""
    response = client.get('/api/health')
    assert response.status_code == 200
    assert response.json['status'] == 'healthy'

def test_login_success(client):
    """Test successful login."""
    from app import db
    user = User(username='logintest', password_hash=generate_password_hash('test123'))
    db.session.add(user)
    db.session.commit()
    
    response = client.post('/api/auth/login', json={
        'username': 'logintest',
        'password': 'test123'
    })
    assert response.status_code == 200
    assert 'token' in response.json

def test_login_failure(client):
    """Test login with wrong credentials."""
    response = client.post('/api/auth/login', json={
        'username': 'nonexistent',
        'password': 'wrongpass'
    })
    assert response.status_code == 401

def test_signup(client):
    """Test user registration."""
    response = client.post('/api/auth/signup', json={
        'username': 'newuser',
        'password': 'newpass123'
    })
    assert response.status_code == 201
    assert response.json['user']['username'] == 'newuser'