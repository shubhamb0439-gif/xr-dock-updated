-- Migration to add authentication columns to users table
-- Run this manually in your Azure SQL database

USE XRbase;
GO

-- Check if email column exists, if not add it
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[users]') AND name = 'email')
BEGIN
    ALTER TABLE dbo.users
    ADD email VARCHAR(255) NULL;

    PRINT 'Added email column to users table';
END
ELSE
BEGIN
    PRINT 'Email column already exists';
END
GO

-- Check if password column exists, if not add it
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[users]') AND name = 'password')
BEGIN
    ALTER TABLE dbo.users
    ADD password VARCHAR(255) NULL;

    PRINT 'Added password column to users table';
END
ELSE
BEGIN
    PRINT 'Password column already exists';
END
GO

-- Create unique index on email for faster lookups and uniqueness
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'UQ_users_email' AND object_id = OBJECT_ID(N'[dbo].[users]'))
BEGIN
    CREATE UNIQUE NONCLUSTERED INDEX UQ_users_email
    ON dbo.users(email)
    WHERE email IS NOT NULL;

    PRINT 'Created unique index on email column';
END
ELSE
BEGIN
    PRINT 'Email index already exists';
END
GO

PRINT 'Migration completed successfully!';
