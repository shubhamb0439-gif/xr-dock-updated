# Authentication Integration - Setup Complete

## Overview
Your XR Messaging project now has complete sign-in and sign-up functionality integrated with Azure SQL (MSSQL) database support.

## What Was Added

### Backend Files
- `backend/auth/auth-service.js` - Core authentication logic with mock/database modes
- `backend/auth/auth-routes.js` - REST API endpoints for signup and signin
- `backend/auth/auth-middleware.js` - JWT token verification middleware

### Frontend Files
- `frontend/views/login.html` - Professional sign-in page
- `frontend/views/signup.html` - Complete registration page

### Modified Files
- `backend/server.js` - Added auth routes registration
- `.env` - Added JWT_SECRET variable

## Current Status: MOCK MODE

The project is currently running with **dummy credentials** in the `.env` file. This means:
- ✅ Server starts successfully without errors
- ✅ Mock mode automatically activated (in-memory user storage)
- ✅ You can create test accounts and sign in
- ✅ All existing functionality remains intact
- ⚠️ Data resets when server restarts (expected in mock mode)

## How to Test (Mock Mode)

1. **Start the server:**
   ```bash
   npm start
   ```

2. **Visit signup page:**
   ```
   http://localhost:8080/signup
   ```

3. **Create a test account:**
   - Name: Test User
   - Email: test@example.com
   - Password: password123
   - XR ID: XR-TEST-001 (optional)

4. **Sign in:**
   ```
   http://localhost:8080/login
   ```
   Use the credentials you just created.

## Switch to Real Database

To connect to your Azure SQL database:

1. **Open `.env` file**

2. **Replace these values with your real credentials:**
   ```env
   DB_SERVER=your-actual-server.database.windows.net
   DB_CLIENT_ID=your-actual-client-id
   DB_CLIENT_SECRET=your-actual-client-secret
   DB_TENANT_ID=your-actual-tenant-id
   JWT_SECRET=your-secure-random-secret-here
   ```

3. **Restart the server:**
   ```bash
   npm start
   ```

4. **System automatically switches to database mode**

## API Endpoints

### Sign Up
```bash
POST /api/auth/signup
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword",
  "xrId": "XR-5678"  // optional
}
```

### Sign In
```bash
POST /api/auth/signin
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securepassword"
}
```

Both return:
```json
{
  "success": true,
  "message": "...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "xrId": "XR-5678"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## Database Schema Used

### Tables:
- **dbo.users** - Main user records
  - `id`, `name`, `xr` (XR ID), `type`, `status`, `rights`, `timedate`

- **dbo.accessuser** - Authentication credentials
  - `id`, `userid` (FK to users.id), `email`, `password` (bcrypt hashed)

### Lookup Tables:
- **dbo.typeuser** - User types (Provider, Scribe, Employee, etc.)
- **dbo.statususer** - User status (Active, Disabled, Churned)
- **dbo.rightsuser** - User rights/permissions
- **dbo.levelsuser** - User levels (Primary, Secondary, Trainee)
- **dbo.assignusers** - User assignments

## Security Features

✅ Bcrypt password hashing (10 rounds)
✅ JWT tokens with 7-day expiration
✅ SQL injection prevention (parameterized queries)
✅ Email validation
✅ Password minimum length (6 characters)
✅ Automatic fallback to mock mode when DB unavailable
✅ Secure error messages (no credential leakage)

## How It Works

### Mock Mode (Current)
- Checks database availability on startup
- If database connection fails, automatically switches to mock mode
- Stores users in-memory (MOCK_USERS array)
- Perfect for testing and development

### Database Mode (After .env Update)
- Connects to Azure SQL using MSSQL package
- Creates entries in both `users` and `accessuser` tables
- Uses existing lookup tables for type, status, and rights
- Validates credentials against database on login

## No Breaking Changes

✅ All existing routes still work
✅ WebRTC functionality untouched
✅ Socket.IO events unchanged
✅ Device pairing intact
✅ Dashboard and other pages working
✅ File structure exactly as before (only additions)

## Troubleshooting

### Server won't start
- Check that `bcryptjs` and `jsonwebtoken` are installed
- Run: `npm install` in backend directory

### "Cannot GET /signup" error
- Ensure server is running
- Check that routes are registered in server.js

### Database connection fails
- System automatically switches to mock mode
- Check console for: `[AUTH] Running in MOCK MODE`
- Verify `.env` credentials are correct when using real database

## Next Steps

1. ✅ Test signup and login in mock mode
2. ✅ Verify existing functionality still works
3. ⏳ Replace dummy credentials in `.env` with real ones
4. ⏳ Restart server to connect to Azure SQL
5. ⏳ Test with real database

Your authentication system is ready to use!
