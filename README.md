# SafeSteps Backend API

Backend server for SafeSteps - Women Safety Application

## Tech Stack

- **Node.js** with Express.js
- **MongoDB** with Mongoose
- **Socket.io** for real-time notifications
- **JWT** for authentication
- **bcryptjs** for password hashing

## Features

- ✅ Role-based authentication (Admin, Responder, End User)
- ✅ Emergency trigger system with real-time notifications
- ✅ Device management and assignment
- ✅ Geospatial location tracking
- ✅ Response management for emergency responders
- ✅ Comprehensive logging and statistics
- ✅ WebSocket support for real-time updates

## Installation

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env` file:

```bash
cp .env.example .env
```

3. Update `.env` with your configuration:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/safesteps
JWT_SECRET=your_secure_jwt_secret_here
JWT_EXPIRE=7d
ADMIN_EMAIL=admin@safesteps.com
ADMIN_PASSWORD=Admin@123
CLIENT_URL=http://localhost:5173
```

4. Start MongoDB service

5. Run the server:

**Development mode:**

```bash
npm run dev
```

**Production mode:**

```bash
npm start
```

## Default Admin Credentials

After first run, a default admin account will be created:

- **Email:** admin@safesteps.com
- **Password:** Admin@123

⚠️ **Please change these credentials after first login!**

## API Documentation

### Authentication Endpoints

#### Register User

```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "+1234567890",
  "role": "enduser"
}
```

#### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Get Current User

```http
GET /api/auth/me
Authorization: Bearer {token}
```

#### Update Profile

```http
PUT /api/auth/profile
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "John Updated",
  "phone": "+1234567890",
  "emergencyContacts": [...]
}
```

#### Change Password

```http
PUT /api/auth/change-password
Authorization: Bearer {token}
Content-Type: application/json

{
  "currentPassword": "oldpass123",
  "newPassword": "newpass123"
}
```

### User Management (Admin)

#### Get All Users

```http
GET /api/users?role=enduser&isActive=true&search=john
Authorization: Bearer {admin_token}
```

#### Get User by ID

```http
GET /api/users/:id
Authorization: Bearer {token}
```

#### Update User

```http
PUT /api/users/:id
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "isActive": false
}
```

#### Delete User

```http
DELETE /api/users/:id
Authorization: Bearer {admin_token}
```

#### Get User Statistics

```http
GET /api/users/stats
Authorization: Bearer {admin_token}
```

### Device Management

#### Create Device (Admin)

```http
POST /api/devices
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "deviceId": "DEV001",
  "deviceName": "Emergency Button 1",
  "deviceType": "button",
  "serialNumber": "SN123456"
}
```

#### Get All Devices (Admin)

```http
GET /api/devices?status=active&deviceType=button
Authorization: Bearer {admin_token}
```

#### Get My Devices (End User)

```http
GET /api/devices/my-devices
Authorization: Bearer {enduser_token}
```

#### Assign Device to User (Admin)

```http
PUT /api/devices/:id/assign
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "userId": "user_id_here"
}
```

#### Unassign Device (Admin)

```http
PUT /api/devices/:id/unassign
Authorization: Bearer {admin_token}
```

### Emergency Triggers

#### Create Emergency Trigger (End User)

```http
POST /api/triggers
Authorization: Bearer {enduser_token}
Content-Type: application/json

{
  "deviceId": "device_id_here",
  "location": {
    "coordinates": [longitude, latitude],
    "address": "123 Main St, City"
  },
  "description": "Emergency situation",
  "priority": "high"
}
```

#### Get All Triggers (Admin)

```http
GET /api/triggers?status=active&priority=high
Authorization: Bearer {admin_token}
```

#### Get My Triggers (End User)

```http
GET /api/triggers/my-triggers
Authorization: Bearer {enduser_token}
```

#### Get Active Triggers (Responder)

```http
GET /api/triggers/active
Authorization: Bearer {responder_token}
```

#### Update Trigger Status

```http
PUT /api/triggers/:id/status
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "resolved",
  "resolutionNotes": "Situation resolved"
}
```

#### Cancel Trigger (End User)

```http
PUT /api/triggers/:id/cancel
Authorization: Bearer {enduser_token}
```

### Response Management (Responder)

#### Accept Emergency

```http
POST /api/responses/:triggerId/accept
Authorization: Bearer {responder_token}
Content-Type: application/json

{
  "location": {
    "coordinates": [longitude, latitude]
  },
  "estimatedArrival": "2024-01-01T12:00:00Z"
}
```

#### Update Response Status

```http
PUT /api/responses/:id/status
Authorization: Bearer {responder_token}
Content-Type: application/json

{
  "status": "en_route",
  "notes": "On the way"
}
```

#### Add Action

```http
POST /api/responses/:id/actions
Authorization: Bearer {responder_token}
Content-Type: application/json

{
  "action": "Called victim"
}
```

#### Get My Responses

```http
GET /api/responses/my-responses?status=completed
Authorization: Bearer {responder_token}
```

## Database Models

### User

- name, email, password (hashed)
- role: admin | responder | enduser
- phone, emergencyContacts, medicalInfo
- address, responderDetails
- isActive status

### Device

- deviceId, deviceName, deviceType
- assignedTo (User reference)
- status: active | inactive | maintenance | unassigned
- batteryLevel, lastPing, firmwareVersion

### Trigger

- triggeredBy (User reference)
- device (Device reference)
- location (GeoJSON Point)
- status: active | responded | resolved | false_alarm | cancelled
- priority: low | medium | high | critical
- respondersNotified, activeResponders
- resolvedBy, resolutionNotes

### Response

- trigger (Trigger reference)
- responder (User reference)
- status: notified | accepted | en_route | arrived | completed | declined
- responseTime, arrivalTime
- location, estimatedArrival, actualArrival
- notes, actionsTaken

## Socket.io Events

### Client → Server

- `join-responders`: Join responders room
- `join-user`: Join user's personal room

### Server → Client

- `emergency-alert`: New emergency triggered
- `trigger-accepted`: Responder accepted emergency
- `trigger-updated`: Trigger status changed
- `trigger-cancelled`: Trigger cancelled by user
- `responder-assigned`: Responder assigned to victim
- `response-updated`: Response status updated

## Project Structure

```
backend/
├── config/
│   └── db.js                 # MongoDB connection
├── controllers/
│   ├── authController.js     # Authentication logic
│   ├── userController.js     # User management
│   ├── deviceController.js   # Device management
│   ├── triggerController.js  # Emergency triggers
│   └── responseController.js # Response management
├── middleware/
│   ├── auth.js              # JWT authentication
│   └── validator.js         # Request validation
├── models/
│   ├── User.js              # User schema
│   ├── Device.js            # Device schema
│   ├── Trigger.js           # Trigger schema
│   └── Response.js          # Response schema
├── routes/
│   ├── authRoutes.js        # Auth endpoints
│   ├── userRoutes.js        # User endpoints
│   ├── deviceRoutes.js      # Device endpoints
│   ├── triggerRoutes.js     # Trigger endpoints
│   └── responseRoutes.js    # Response endpoints
├── utils/
│   ├── auth.js              # Auth utilities
│   └── initAdmin.js         # Admin initialization
├── .env.example             # Environment variables template
├── .gitignore
├── package.json
└── server.js                # Application entry point
```

## Error Handling

All API responses follow this format:

**Success Response:**

```json
{
  "success": true,
  "data": {...},
  "count": 10  // For list endpoints
}
```

**Error Response:**

```json
{
  "success": false,
  "message": "Error message",
  "errors": [...]  // Validation errors
}
```

## Security Features

- Password hashing with bcrypt
- JWT-based authentication
- Role-based access control
- Input validation and sanitization
- CORS configuration
- Environment variable protection

## Development

### Running Tests

```bash
npm test
```

### Code Formatting

```bash
npm run format
```

### Linting

```bash
npm run lint
```

## Deployment

1. Set `NODE_ENV=production` in `.env`
2. Update `MONGODB_URI` with production database
3. Set secure `JWT_SECRET`
4. Configure CORS for production domain
5. Use process manager (PM2, Forever) for production

## Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## License

ISC

## Support

For support, email support@safesteps.com
