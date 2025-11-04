-- Fix password column size in accessuser table to support bcrypt hashes
-- Bcrypt hashes are 60 characters long
-- Run this in SQL Server Management Studio

USE XRbase;
GO

-- Check current column size (optional)
SELECT
    COLUMN_NAME,
    DATA_TYPE,
    CHARACTER_MAXIMUM_LENGTH
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'accessuser'
    AND COLUMN_NAME = 'password';
GO

-- Alter the password column to VARCHAR(255) to support bcrypt hashes
ALTER TABLE dbo.accessuser
ALTER COLUMN password VARCHAR(255) NULL;
GO

-- Verify the change
SELECT
    COLUMN_NAME,
    DATA_TYPE,
    CHARACTER_MAXIMUM_LENGTH
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'accessuser'
    AND COLUMN_NAME = 'password';
GO

PRINT 'Password column updated successfully to VARCHAR(255)';
