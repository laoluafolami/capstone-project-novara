from app.models import Task

def test_get_tasks_unauthorized(client):
    """Test that tasks endpoint requires auth."""
    response = client.get('/api/tasks')
    assert response.status_code == 401

def test_get_tasks_authorized(client, auth_headers):
    """Test getting tasks with valid token."""
    response = client.get('/api/tasks', headers=auth_headers)
    assert response.status_code == 200
    assert isinstance(response.json, list)

def test_create_task(client, auth_headers):
    """Test creating a new task."""
    response = client.post('/api/tasks', 
        headers=auth_headers,
        json={
            'title': 'Test Task',
            'description': 'Test Description',
            'priority': 'high',
            'status': 'todo'
        }
    )
    assert response.status_code == 201
    assert response.json['title'] == 'Test Task'
    assert response.json['priority'] == 'high'

def test_update_task(client, auth_headers):
    """Test updating a task."""
    # Create task first
    create_resp = client.post('/api/tasks',
        headers=auth_headers,
        json={'title': 'Original', 'status': 'todo'}
    )
    task_id = create_resp.json['id']
    
    # Update it
    update_resp = client.put(f'/api/tasks/{task_id}',
        headers=auth_headers,
        json={'status': 'done'}
    )
    assert update_resp.status_code == 200
    assert update_resp.json['status'] == 'done'

def test_delete_task(client, auth_headers):
    """Test deleting a task."""
    # Create task
    create_resp = client.post('/api/tasks',
        headers=auth_headers,
        json={'title': 'To Delete'}
    )
    task_id = create_resp.json['id']
    
    # Delete it
    delete_resp = client.delete(f'/api/tasks/{task_id}', headers=auth_headers)
    assert delete_resp.status_code == 200
    
    # Verify deletion
    get_resp = client.get('/api/tasks', headers=auth_headers)
    assert len(get_resp.json) == 0