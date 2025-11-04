const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Sequelize } = require('sequelize');
const { sequelize } = require('../database/database-config');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
const JWT_EXPIRES_IN = '7d';

const MOCK_USERS = [];

function isDatabaseAvailable() {
  try {
    return sequelize && sequelize.authenticate !== undefined;
  } catch {
    return false;
  }
}

function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email || user.Email,
      xrId: user.xr || user.xrId || user.XR
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

  if (!isDatabaseAvailable()) {
    console.log('[AUTH] Running in MOCK MODE - no database connection');

    const existingUser = MOCK_USERS.find(u => u.email === email);
    if (existingUser) {
      throw new Error('User already exists');
    }

    const mockUser = {
      id: MOCK_USERS.length + 1,
      name,
      email,
      password: hashedPassword,
      xrId: xrId || `XR-MOCK-${Date.now()}`,
      createdAt: new Date()
    };

    MOCK_USERS.push(mockUser);

    const token = generateToken(mockUser);
    return {
      user: {
        id: mockUser.id,
        name: mockUser.name,
        email: mockUser.email,
        xrId: mockUser.xrId
      },
      token
    };
  }

  try {
    const existingAccessUser = await sequelize.query(
      'SELECT userid FROM dbo.accessuser WHERE email = :email',
      {
        replacements: { email },
        type: Sequelize.QueryTypes.SELECT
      }
    );

    if (existingAccessUser && existingAccessUser.length > 0) {
      throw new Error('User already exists');
    }

    const statusActive = await sequelize.query(
      'SELECT id FROM dbo.statususer WHERE status = :status',
      {
        replacements: { status: 'Active' },
        type: Sequelize.QueryTypes.SELECT
      }
    );
    const statusId = statusActive && statusActive[0] ? statusActive[0].id : 1;

    const typeScribe = await sequelize.query(
      'SELECT id FROM dbo.typeuser WHERE typeuser = :type',
      {
        replacements: { type: 'Scribe' },
        type: Sequelize.QueryTypes.SELECT
      }
    );
    const typeId = typeScribe && typeScribe[0] ? typeScribe[0].id : 2;

    const rightsDefault = await sequelize.query(
      'SELECT id FROM dbo.rightsuser WHERE rights = :rights',
      {
        replacements: { rights: 'Provider' },
        type: Sequelize.QueryTypes.SELECT
      }
    );
    const rightsId = rightsDefault && rightsDefault[0] ? rightsDefault[0].id : 1;

    await sequelize.query(
      `INSERT INTO dbo.users (name, xr, type, status, rights, timedate)
       VALUES (:name, :xr, :type, :status, :rights, GETDATE())`,
      {
        replacements: {
          name,
          xr: xrId || `XR-${Date.now()}`,
          type: typeId,
          status: statusId,
          rights: rightsId
        },
        type: Sequelize.QueryTypes.INSERT
      }
    );

    const newUser = await sequelize.query(
      'SELECT TOP 1 id, name, xr FROM dbo.users WHERE name = :name ORDER BY id DESC',
      {
        replacements: { name },
        type: Sequelize.QueryTypes.SELECT
      }
    );

    if (!newUser || newUser.length === 0) {
      throw new Error('Failed to create user');
    }

    const userId = newUser[0].id;

    await sequelize.query(
      `INSERT INTO dbo.accessuser (userid, email, password)
       VALUES (:userid, :email, :password)`,
      {
        replacements: {
          userid: userId,
          email,
          password: hashedPassword
        },
        type: Sequelize.QueryTypes.INSERT
      }
    );

    const token = generateToken({
      id: userId,
      email,
      xrId: newUser[0].xr
    });

    return {
      user: {
        id: userId,
        name: newUser[0].name,
        email,
        xrId: newUser[0].xr
      },
      token
    };

  } catch (error) {
    console.error('[AUTH] Database signup error:', error.message);
    throw error;
  }
}

async function signIn({ email, password }) {
  if (!email || !password) {
    throw new Error('Email and password are required');
  }

  if (!isDatabaseAvailable()) {
    console.log('[AUTH] Running in MOCK MODE - no database connection');

    const mockUser = MOCK_USERS.find(u => u.email === email);
    if (!mockUser) {
      throw new Error('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, mockUser.password);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    const token = generateToken(mockUser);
    return {
      user: {
        id: mockUser.id,
        name: mockUser.name,
        email: mockUser.email,
        xrId: mockUser.xrId
      },
      token
    };
  }

  try {
    const accessUserData = await sequelize.query(
      'SELECT id, userid, email, password FROM dbo.accessuser WHERE email = :email',
      {
        replacements: { email },
        type: Sequelize.QueryTypes.SELECT
      }
    );

    if (!accessUserData || accessUserData.length === 0) {
      throw new Error('Invalid credentials');
    }

    const accessUser = accessUserData[0];

    const isPasswordValid = await bcrypt.compare(password, accessUser.password);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    const userData = await sequelize.query(
      'SELECT id, name, xr FROM dbo.users WHERE id = :userid',
      {
        replacements: { userid: accessUser.userid },
        type: Sequelize.QueryTypes.SELECT
      }
    );

    if (!userData || userData.length === 0) {
      throw new Error('User data not found');
    }

    const user = userData[0];

    const token = generateToken({
      id: user.id,
      email,
      xrId: user.xr
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email,
        xrId: user.xr
      },
      token
    };

  } catch (error) {
    console.error('[AUTH] Database signin error:', error.message);
    throw error;
  }
}

module.exports = {
  signUp,
  signIn,
  generateToken
};
