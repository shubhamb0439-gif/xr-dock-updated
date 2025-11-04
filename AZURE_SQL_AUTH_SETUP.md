# Azure SQL Authentication Setup

## Overview
Your authentication system is now configured to use **Azure SQL (MSSQL)** database with your existing schema.

## ⚠️ IMPORTANT: Database Migration Required

Before the authentication will work, you **MUST** add two columns to your `users` table:

### Step 1: Run the Migration SQL

1. **Open Azure SQL Query Editor** or **SQL Server Management Studio**
2. **Connect to your Azure SQL database** (XRbase)
3. **Run the migration script** located at:
   ```
   backend/auth/add-auth-columns.sql
   ```

This script will:
- Add `email VARCHAR(255)` column to `users` table
- Add `password VARCHAR(255)` column to `users` table
- Create unique index on `email` for fast lookups
- Check if columns exist first (safe to run multiple times)

### Step 2: Verify Migration

After running the migration, your `users` table should have:

**Existing columns:**
- `id` (int, primary key)
- `name` (varchar(50))
- `xr` (char(7))
- `type` (int) - FK to typeuser
- `status` (int) - FK to statususer
- `rights` (int) - FK to rightsuser
- `timedate` (datetime)

**New columns:**
- `email` (varchar(255), unique)
- `password` (varchar(255), bcrypt hashed)

## How It Works

### Database Schema
The authentication uses your **existing tables**:

**Main Table:**
- `dbo.users` - Stores user accounts WITH email and password

**Lookup Tables (unchanged):**
- `dbo.typeuser` - User types (Provider, Scribe, Employee)
- `dbo.statususer` - User status (Active, Disabled, Churned)
- `dbo.rightsuser` - User permissions
- `dbo.levelsuser` - User levels
- `dbo.assignusers` - User assignments

### Signup Process
1. Validates email format and password length
2. Checks if email already exists
3. Hashes password with bcrypt (10 rounds)
4. Looks up default values from lookup tables:
   - Type: "Scribe" (or falls back to id=2)
   - Status: "Active" (or falls back to id=1)
   - Rights: "Provider" (or falls back to id=1)
5. Inserts new user with all fields including email and password
6. Returns JWT token

### Signin Process
1. Looks up user by email
2. Verifies password with bcrypt
3. Returns JWT token with user data

## Configuration

### Environment Variables (.env)
Make sure these are set correctly:

```env
# Azure SQL Database
DB_NAME=XRbase
DB_SERVER=your-server.database.windows.net
DB_PORT=1433
DB_CLIENT_ID=your-azure-client-id
DB_CLIENT_SECRET=your-azure-client-secret
DB_TENANT_ID=your-azure-tenant-id

# JWT Secret
JWT_SECRET=your-secure-random-secret

# Optional: Azure Environment
AZURE_ENV=DEVELOPMENT
```

## Testing

### 1. Start Server
```bash
npm start
```

### 2. Create Account
Visit: `http://localhost:8080/signup`

Fill in:
- Name: Test User
- Email: test@example.com
- Password: test123
- XR ID: XR-TEST-001 (or leave blank to auto-generate)

### 3. Sign In
Visit: `http://localhost:8080/login`

Use the credentials you just created.

## API Endpoints

### POST /api/auth/signup
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepass",
  "xrId": "XR-1234"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "xrId": "XR-1234"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### POST /api/auth/signin
```json
{
  "email": "john@example.com",
  "password": "securepass"
}
```

**Response:** Same as signup

## Security Features

✅ **Bcrypt Password Hashing** - 10 rounds, passwords never stored in plain text
✅ **JWT Tokens** - 7-day expiration
✅ **SQL Injection Prevention** - Parameterized queries via Sequelize
✅ **Email Validation** - Format checked before signup
✅ **Password Requirements** - Minimum 6 characters
✅ **Unique Email** - Database constraint prevents duplicates
✅ **Lookup Table Integration** - Uses your existing typeuser, statususer, rightsuser

## Database Columns Created

```sql
-- Email column
email VARCHAR(255) NULL

-- Password column (stores bcrypt hash)
password VARCHAR(255) NULL

-- Unique index on email
CREATE UNIQUE NONCLUSTERED INDEX UQ_users_email
ON dbo.users(email) WHERE email IS NOT NULL
```

## Troubleshooting

### "Invalid column name 'email'" or "Invalid column name 'password'"
**Solution:** Run the migration SQL script in `backend/auth/add-auth-columns.sql`

### "User already exists"
**Solution:** Email is already registered. Try a different email or use signin.

### Database connection fails
**Solution:**
- Verify `.env` credentials are correct
- Check Azure SQL firewall allows your IP
- Test connection using Azure Data Studio or SSMS

### "Account not set up for password authentication"
**Solution:** User record exists but has NULL password. This happens for users created before the migration.

## Migration File Location

```
backend/auth/add-auth-columns.sql
```

Copy this file's contents and run them in your Azure SQL Query Editor.

## Complete File Structure

```
backend/
├── auth/
│   ├── auth-service.js          (Azure SQL integration)
│   ├── auth-routes.js           (API endpoints)
│   ├── auth-middleware.js       (JWT verification)
│   └── add-auth-columns.sql     (Migration script)
├── database/
│   └── database-config.js       (Sequelize config)
└── server.js                    (Routes registered)

frontend/
└── views/
    ├── login.html              (Sign in page)
    └── signup.html             (Registration page)
```

## Next Steps

1. ✅ Run migration SQL in Azure SQL
2. ✅ Verify email and password columns exist
3. ✅ Update .env with real Azure SQL credentials
4. ✅ Restart server: `npm start`
5. 🎯 Test signup at `/signup`
6. 🎯 Test signin at `/login`

Your authentication is now using Azure SQL!
