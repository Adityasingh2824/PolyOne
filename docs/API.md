# PolyOne API Documentation

Base URL: `http://localhost:5000/api`

## 🔐 Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

## 📝 Endpoints

### Authentication

#### POST /auth/signup
Create a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "company": "Acme Inc",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "message": "User created successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "company": "Acme Inc"
  }
}
```

#### POST /auth/login
Login to existing account.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "company": "Acme Inc"
  }
}
```

#### GET /auth/me
Get current user information. Requires authentication.

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "company": "Acme Inc"
  }
}
```

### Chains

#### GET /chains
Get all chains for authenticated user.

**Response:**
```json
{
  "chains": [
    {
      "id": "chain-uuid",
      "name": "My Gaming Chain",
      "chainType": "public",
      "rollupType": "zk-rollup",
      "gasToken": "GAME",
      "validators": 5,
      "status": "active",
      "uptime": 99.9,
      "tps": 850,
      "transactions": 125000,
      "createdAt": "2025-01-15T10:30:00Z",
      "rpcUrl": "https://rpc-abc123.polyone.io",
      "explorerUrl": "https://explorer-abc123.polyone.io",
      "chainId": 654321
    }
  ],
  "stats": {
    "totalChains": 1,
    "activeChains": 1,
    "totalTransactions": 125000,
    "averageUptime": 99.9
  }
}
```

#### GET /chains/:id
Get specific chain details.

**Response:**
```json
{
  "id": "chain-uuid",
  "name": "My Gaming Chain",
  "chainType": "public",
  "rollupType": "zk-rollup",
  "gasToken": "GAME",
  "validators": 5,
  "status": "active",
  "uptime": 99.9,
  "tps": 850,
  "transactions": 125000,
  "createdAt": "2025-01-15T10:30:00Z",
  "rpcUrl": "https://rpc-abc123.polyone.io",
  "explorerUrl": "https://explorer-abc123.polyone.io",
  "chainId": 654321
}
```

#### POST /chains/create
Create and deploy a new blockchain.

**Request Body:**
```json
{
  "name": "My Gaming Chain",
  "chainType": "public",
  "rollupType": "zk-rollup",
  "gasToken": "GAME",
  "validatorAccess": "public",
  "initialValidators": "5"
}
```

**Response:**
```json
{
  "message": "Chain deployment started",
  "chainId": "chain-uuid",
  "chain": {
    "id": "chain-uuid",
    "name": "My Gaming Chain",
    "status": "deploying",
    "rpcUrl": "https://rpc-abc123.polyone.io",
    "explorerUrl": "https://explorer-abc123.polyone.io"
  }
}
```

#### PUT /chains/:id
Update chain configuration.

**Request Body:**
```json
{
  "validators": 10,
  "status": "active"
}
```

**Response:**
```json
{
  "message": "Chain updated",
  "chain": { /* updated chain object */ }
}
```

#### DELETE /chains/:id
Delete a chain.

**Response:**
```json
{
  "message": "Chain deleted successfully"
}
```

### Monitoring

#### GET /monitoring/:chainId/metrics
Get real-time metrics for a chain.

**Response:**
```json
{
  "timestamp": "2025-01-15T10:30:00Z",
  "tps": 850,
  "blockTime": "2.1",
  "gasPrice": "0.000125",
  "activeValidators": 12,
  "networkHashrate": "523.45",
  "pendingTransactions": 45,
  "uptime": "99.95"
}
```

#### GET /monitoring/:chainId/analytics
Get historical analytics data.

**Query Parameters:**
- `period` (optional): 24h, 7d, 30d (default: 24h)

**Response:**
```json
{
  "data": [
    {
      "timestamp": "2025-01-15T09:00:00Z",
      "transactions": 1250,
      "tps": 750,
      "blockTime": "2.05",
      "gasUsed": 850000
    }
  ],
  "period": "24h"
}
```

#### GET /monitoring/:chainId/logs
Get chain logs.

**Query Parameters:**
- `level` (optional): all, info, warning, error
- `limit` (optional): number of logs to return (default: 50, max: 100)

**Response:**
```json
{
  "logs": [
    {
      "id": "log-1",
      "timestamp": "2025-01-15T10:30:00Z",
      "level": "info",
      "message": "Block mined successfully",
      "source": "validator"
    }
  ],
  "total": 50
}
```

## 🔄 Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## ⚡ Rate Limiting

- **Standard users**: 100 requests per minute
- **Enterprise users**: 1000 requests per minute

## 🔌 WebSocket Events

Connect to: `ws://localhost:5000/ws`

### Events

#### chain:status
Real-time chain status updates.

```json
{
  "event": "chain:status",
  "chainId": "chain-uuid",
  "status": "active",
  "uptime": 99.9
}
```

#### chain:metrics
Real-time metrics updates (every 15 seconds).

```json
{
  "event": "chain:metrics",
  "chainId": "chain-uuid",
  "tps": 850,
  "blockTime": 2.1
}
```

## 🧪 Example Usage

### JavaScript/TypeScript

```javascript
const axios = require('axios');

const API_URL = 'http://localhost:5000/api';
const token = 'your_jwt_token';

// Create a new chain
async function createChain() {
  const response = await axios.post(
    `${API_URL}/chains/create`,
    {
      name: 'My Chain',
      chainType: 'public',
      rollupType: 'zk-rollup',
      gasToken: 'POLY',
      validatorAccess: 'public',
      initialValidators: '3'
    },
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  console.log(response.data);
}
```

### Python

```python
import requests

API_URL = 'http://localhost:5000/api'
token = 'your_jwt_token'

headers = {
    'Authorization': f'Bearer {token}',
    'Content-Type': 'application/json'
}

# Get all chains
response = requests.get(f'{API_URL}/chains', headers=headers)
chains = response.json()
print(chains)
```

### cURL

```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'

# Get chains
curl -X GET http://localhost:5000/api/chains \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 📚 SDKs

Coming soon:
- JavaScript/TypeScript SDK
- Python SDK
- Go SDK
- Rust SDK

