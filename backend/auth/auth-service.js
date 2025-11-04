const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
const JWT_EXPIRES_IN = '7d';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

let supabase = null;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
  console.log('[AUTH] Using Supabase for authentication');
} else {
  console.log('[AUTH] No Supabase credentials - authentication will fail');
}

function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      xrId: user.xr_id || user.xrId
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

  if (!supabase) {
    throw new Error('Database not available - check Supabase configuration');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('[AUTH] Check error:', checkError);
      throw new Error(`Database error: ${checkError.message}`);
    }

    if (existingUser) {
      throw new Error('User already exists');
    }

    const generatedXrId = xrId || `XR-${Date.now()}`;

    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        name,
        email,
        password: hashedPassword,
        xr_id: generatedXrId
      })
      .select()
      .single();

    if (insertError) {
      console.error('[AUTH] Insert error:', insertError);
      if (insertError.code === '23505') {
        if (insertError.message.includes('email')) {
          throw new Error('User already exists');
        }
        if (insertError.message.includes('xr_id')) {
          throw new Error('XR ID already in use');
        }
      }
      throw new Error(`Failed to create user: ${insertError.message}`);
    }

    const token = generateToken(newUser);

    return {
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        xrId: newUser.xr_id
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

  if (!supabase) {
    throw new Error('Database not available - check Supabase configuration');
  }

  try {
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (fetchError) {
      console.error('[AUTH] Fetch error:', fetchError);
      throw new Error(`Database error: ${fetchError.message}`);
    }

    if (!user) {
      throw new Error('Invalid credentials');
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
        xrId: user.xr_id
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
