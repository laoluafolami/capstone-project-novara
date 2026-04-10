#!/bin/bash

BASE_URL="http://localhost:5000/api"

echo "=== Testing TaskApp API ==="

# 1. Health check
echo -e "\n1. Health Check:"
curl -s $BASE_URL/health | jq .

# 2. Login (assuming user exists)
echo -e "\n2. Login:"
TOKEN=$(curl -s -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"teacher","password":"teach123"}' | jq -r '.token')
echo "Token received: ${TOKEN:0:20}..."

# 3. Create task
echo -e "\n3. Create Task:"
curl -s -X POST $BASE_URL/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"Learn CD Pipelines","description":"Teach students about CI/CD","priority":"high","status":"todo"}' | jq .

# 4. Get all tasks
echo -e "\n4. List Tasks:"
curl -s $BASE_URL/tasks \
  -H "Authorization: Bearer $TOKEN" | jq .

# 5. Create another task
echo -e "\n5. Create Another Task:"
curl -s -X POST $BASE_URL/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"Deploy to AWS","description":"Use GitHub Actions","priority":"medium","status":"in_progress"}' | jq .

# 6. Final list
echo -e "\n6. Final Task List:"
curl -s $BASE_URL/tasks \
  -H "Authorization: Bearer $TOKEN" | jq .
