import { Task, CreateTaskInput, UpdateTaskInput } from '../types/task';

const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'An error occurred' }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }
  return response.json();
}

// NEW: Health check for CI/CD
export const healthApi = {
  async checkHealth(): Promise<{status: string, database: string}> {
    const response = await fetch(`${API_BASE_URL}/health`);
    return handleResponse(response);
  }
};

export const taskApi = {
  async getTasks(): Promise<Task[]> {
    const response = await fetch(`${API_BASE_URL}/tasks`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Task[]>(response);
  },

  async createTask(task: CreateTaskInput): Promise<Task> {
    const response = await fetch(`${API_BASE_URL}/tasks`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(task),
    });
    return handleResponse<Task>(response);
  },

  async updateTask(id: number, updates: UpdateTaskInput): Promise<Task> {
    const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });
    return handleResponse<Task>(response);
  },

  async deleteTask(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    await handleResponse<{ message: string }>(response);
  },
};