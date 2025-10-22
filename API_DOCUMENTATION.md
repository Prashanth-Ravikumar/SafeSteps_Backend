# SafeSteps API Documentation

## Base URL

```
http://localhost:5000/api
```

## Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

---

## Authentication Endpoints

### 1. Register User

**POST** `/auth/register`

Register a new user (End User or Responder)

**Request Body:**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "Password123!",
  "phone": "+1234567890",
  "role": "enduser", // or "responder"
  "emergencyContact": {
    "name": "Jane Doe",
    "phone": "+1234567891",
    "relationship": "Sister"
  },
  "medicalInfo": "Blood Type: O+" // Optional
}
```

**Response:**

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "enduser"
    },
    "token": "jwt_token_here"
  }
}
```

---

### 2. Login

**POST** `/auth/login`

**Request Body:**

```json
{
  "email": "john@example.com",
  "password": "Password123!"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "enduser"
    },
    "token": "jwt_token_here"
  }
}
```

---

### 3. Get Current User

**GET** `/auth/me`

**Headers:** Authorization required

**Response:**

```json
{
  "success": true,
  "data": {
    "_id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "enduser",
    "phone": "+1234567890",
    "emergencyContact": { ... },
    "medicalInfo": "Blood Type: O+"
  }
}
```

---

## User Management Endpoints

### 4. Get All Users (Admin Only)

**GET** `/users`

**Headers:** Authorization required (Admin)

**Response:**

```json
{
  "success": true,
  "count": 10,
  "data": [
    {
      "_id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "enduser",
      "isActive": true
    }
  ]
}
```

---

### 5. Get User by ID (Admin Only)

**GET** `/users/:id`

**Headers:** Authorization required (Admin)

---

### 6. Update User Profile

**PUT** `/users/:id`

**Headers:** Authorization required (Owner or Admin)

**Request Body:**

```json
{
  "name": "John Updated",
  "phone": "+1234567890",
  "emergencyContact": {
    "name": "Jane Doe",
    "phone": "+1234567891",
    "relationship": "Sister"
  },
  "medicalInfo": "Blood Type: O+, Allergies: None"
}
```

---

### 7. Deactivate User (Admin Only)

**DELETE** `/users/:id`

**Headers:** Authorization required (Admin)

---

### 8. Get All Responders (Admin Only)

**GET** `/users/responders/all`

**Headers:** Authorization required (Admin)

---

## Device Management Endpoints

### 9. Create Device (Admin Only)

**POST** `/devices`

**Headers:** Authorization required (Admin)

**Request Body:**

```json
{
  "deviceId": "DEV-001",
  "deviceType": "Button",
  "description": "Emergency button for wearable device"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Device created successfully",
  "data": {
    "_id": "device_id",
    "deviceId": "DEV-001",
    "deviceType": "Button",
    "status": "available",
    "isActive": true
  }
}
```

---

### 10. Get All Devices (Admin Only)

**GET** `/devices`

**Headers:** Authorization required (Admin)

**Query Parameters:**

- `status` (optional): filter by status (available, assigned, active, inactive)

---

### 11. Assign Device to User (Admin Only)

**PUT** `/devices/:id/assign`

**Headers:** Authorization required (Admin)

**Request Body:**

```json
{
  "userId": "user_id_here"
}
```

---

### 12. Unassign Device (Admin Only)

**PUT** `/devices/:id/unassign`

**Headers:** Authorization required (Admin)

---

### 13. Get My Device (End User)

**GET** `/devices/my-device`

**Headers:** Authorization required (End User)

---

### 14. Update Device (Admin Only)

**PUT** `/devices/:id`

**Headers:** Authorization required (Admin)

---

### 15. Delete Device (Admin Only)

**DELETE** `/devices/:id`

**Headers:** Authorization required (Admin)

---

## Trigger/Emergency Alert Endpoints

### 16. Create Trigger (End User)

**POST** `/triggers`

**Headers:** Authorization required (End User)

**Request Body:**

```json
{
  "location": {
    "latitude": 40.7128,
    "longitude": -74.006,
    "address": "123 Main St, New York, NY"
  },
  "deviceId": "device_id_here",
  "notes": "Emergency situation - need immediate help"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Emergency trigger created and responders notified",
  "data": {
    "_id": "trigger_id",
    "userId": "user_id",
    "deviceId": "device_id",
    "location": { ... },
    "status": "pending",
    "triggeredAt": "2024-01-01T12:00:00Z"
  }
}
```

**Note:** This will broadcast a real-time notification to all connected responders via Socket.io

---

### 17. Get All Triggers (Admin Only)

**GET** `/triggers`

**Headers:** Authorization required (Admin)

**Query Parameters:**

- `status` (optional): pending, responded, resolved, cancelled
- `userId` (optional): filter by specific user
- `startDate` (optional): filter from date
- `endDate` (optional): filter to date

---

### 18. Get My Triggers (End User)

**GET** `/triggers/my-triggers`

**Headers:** Authorization required (End User)

---

### 19. Get Trigger by ID

**GET** `/triggers/:id`

**Headers:** Authorization required

---

### 20. Update Trigger Status (Admin Only)

**PUT** `/triggers/:id/status`

**Headers:** Authorization required (Admin)

**Request Body:**

```json
{
  "status": "resolved"
}
```

---

### 21. Cancel Trigger (End User/Admin)

**PUT** `/triggers/:id/cancel`

**Headers:** Authorization required (Owner or Admin)

---

## Response Management Endpoints

### 22. Create Response (Responder)

**POST** `/responses`

**Headers:** Authorization required (Responder)

**Request Body:**

```json
{
  "triggerId": "trigger_id_here",
  "status": "accepted",
  "estimatedArrival": "5 minutes",
  "notes": "On my way to the location"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Response created successfully",
  "data": {
    "_id": "response_id",
    "triggerId": "trigger_id",
    "responderId": "responder_id",
    "status": "accepted",
    "responseTime": "2024-01-01T12:05:00Z"
  }
}
```

---

### 23. Get All Responses (Admin Only)

**GET** `/responses`

**Headers:** Authorization required (Admin)

**Query Parameters:**

- `triggerId` (optional): filter by trigger
- `responderId` (optional): filter by responder

---

### 24. Get My Responses (Responder)

**GET** `/responses/my-responses`

**Headers:** Authorization required (Responder)

---

### 25. Get Response by ID

**GET** `/responses/:id`

**Headers:** Authorization required

---

### 26. Update Response

**PUT** `/responses/:id`

**Headers:** Authorization required (Responder/Admin)

**Request Body:**

```json
{
  "status": "arrived",
  "notes": "Arrived at location, victim is safe"
}
```

---

### 27. Get Responses for Trigger

**GET** `/responses/trigger/:triggerId`

**Headers:** Authorization required

---

## WebSocket Events

### Client Events (Emit)

#### Join Responders Room

```javascript
socket.emit("join-responders", userId);
```

#### Join User Room

```javascript
socket.emit("join-user", userId);
```

### Server Events (Listen)

#### New Emergency Alert (Responders)

```javascript
socket.on("emergency-alert", (data) => {
  console.log("New emergency:", data);
  // data contains: trigger details, user info, location
});
```

#### Trigger Update (User)

```javascript
socket.on("trigger-update", (data) => {
  console.log("Trigger status updated:", data);
});
```

#### Response Received (User)

```javascript
socket.on("response-received", (data) => {
  console.log("Responder accepted alert:", data);
});
```

---

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error message here"
}
```

### Common HTTP Status Codes:

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (no token or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

---

## Default Admin Credentials

**Email:** admin@safesteps.com  
**Password:** Admin@123

⚠️ **Important:** Change these credentials in production!

---

## Testing the API

### Using cURL:

**Login:**

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@safesteps.com","password":"Admin@123"}'
```

**Get Users (with token):**

```bash
curl -X GET http://localhost:5000/api/users \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Using Postman or Thunder Client:

1. Import the endpoints from this documentation
2. Set up environment variables for base URL and token
3. Use Collections to organize requests by feature

---

## Database Schema Overview

### Users

- name, email, password (hashed), role, phone
- emergencyContact (name, phone, relationship)
- medicalInfo, location, isActive, devices[]

### Devices

- deviceId (unique), deviceType, description, status
- assignedTo (User reference), lastUsed, isActive

### Triggers

- userId (User reference), deviceId (Device reference)
- location (latitude, longitude, address)
- status, triggeredAt, resolvedAt, notes

### Responses

- triggerId (Trigger reference), responderId (User reference)
- status, responseTime, arrivalTime, completionTime
- estimatedArrival, notes

---

## Development Tips

1. **MongoDB Connection:** Ensure MongoDB is running locally on port 27017
2. **Socket.io Testing:** Use socket.io-client for testing real-time features
3. **Logs:** Check server console for connection and error logs
4. **Environment:** Copy `.env.example` to `.env` and configure

---

## Next Steps for Frontend Integration

1. Set up Axios/Fetch with base URL and token interceptor
2. Implement Socket.io client connection
3. Create authentication context/store
4. Build role-based routing
5. Implement real-time notification system
6. Integrate maps (Leaflet/Google Maps) for location display

---

## Support

For issues or questions, check:

- Server logs in the terminal
- MongoDB connection status
- Environment variables configuration
- JWT token validity
