const express = require('express');
const authService = require('./auth-service');

const router = express.Router();

router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, xrId } = req.body;

    const result = await authService.signUp({ name, email, password, xrId });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      ...result
    });

  } catch (error) {
    console.error('[AUTH_ROUTES] Signup error:', error.message);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await authService.signIn({ email, password });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      ...result
    });

  } catch (error) {
    console.error('[AUTH_ROUTES] Signin error:', error.message);
    res.status(401).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
