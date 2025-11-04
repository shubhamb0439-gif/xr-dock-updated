const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Sequelize } = require('sequelize');
const { sequelize } = require('../database/database-config');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
const JWT_EXPIRES_IN = '7d';

function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      xrId: user.xr
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

async function signUp({ name, email, password, xrId }) {
  if (!name || !email || !password) {
    throw new Error('Name, email, and password are required');
  }

  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error('Invalid email format');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const existingUser = await sequelize.query(
      'SELECT id FROM dbo.users WHERE email = :email',
      {
        replacements: { email },
        type: Sequelize.QueryTypes.SELECT
      }
    );

    if (existingUser && existingUser.length > 0) {
      throw new Error('User already exists');
    }

    const defaultType = await sequelize.query(
      'SELECT TOP 1 id FROM dbo.typeuser WHERE typeuser = :type',
      {
        replacements: { type: 'Scribe' },
        type: Sequelize.QueryTypes.SELECT
      }
    );
    const typeId = defaultType && defaultType[0] ? defaultType[0].id : 2;

    const defaultStatus = await sequelize.query(
      'SELECT TOP 1 id FROM dbo.statususer WHERE status = :status',
      {
        replacements: { status: 'Active' },
        type: Sequelize.QueryTypes.SELECT
      }
    );
    const statusId = defaultStatus && defaultStatus[0] ? defaultStatus[0].id : 1;

    const defaultRights = await sequelize.query(
      'SELECT TOP 1 id FROM dbo.rightsuser WHERE rights = :rights',
      {
        replacements: { rights: 'Provider' },
        type: Sequelize.QueryTypes.SELECT
      }
    );
    const rightsId = defaultRights && defaultRights[0] ? defaultRights[0].id : 1;

    const generatedXrId = xrId || `XR-${Date.now()}`;

    await sequelize.query(
      `INSERT INTO dbo.users (name, xr, type, status, rights, email, password, timedate)
       VALUES (:name, :xr, :type, :status, :rights, :email, :password, GETDATE())`,
      {
        replacements: {
          name,
          xr: generatedXrId,
          type: typeId,
          status: statusId,
          rights: rightsId,
          email,
          password: hashedPassword
        },
        type: Sequelize.QueryTypes.INSERT
      }
    );

    const newUser = await sequelize.query(
      'SELECT TOP 1 id, name, xr, email FROM dbo.users WHERE email = :email ORDER BY id DESC',
      {
        replacements: { email },
        type: Sequelize.QueryTypes.SELECT
      }
    );

    if (!newUser || newUser.length === 0) {
      throw new Error('Failed to create user');
    }

    const user = newUser[0];
    const token = generateToken(user);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        xrId: user.xr
      },
      token
    };

  } catch (error) {
    console.error('[AUTH] Signup error:', error.message);
    throw error;
  }
}

async function signIn({ email, password }) {
  if (!email || !password) {
    throw new Error('Email and password are required');
  }

  try {
    const userData = await sequelize.query(
      'SELECT id, name, xr, email, password FROM dbo.users WHERE email = :email',
      {
        replacements: { email },
        type: Sequelize.QueryTypes.SELECT
      }
    );

    if (!userData || userData.length === 0) {
      throw new Error('Invalid credentials');
    }

    const user = userData[0];

    if (!user.password) {
      throw new Error('Account not set up for password authentication');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    const token = generateToken(user);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        xrId: user.xr
      },
      token
    };

  } catch (error) {
    console.error('[AUTH] Signin error:', error.message);
    throw error;
  }
}

module.exports = {
  signUp,
  signIn,
  generateToken
};
