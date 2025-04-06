const express = require('express');
const fetch = require('node-fetch');
const fs = require('fs');
const { findAndProcessNewCharge } = require('./stripe');
require('dotenv').config();

const cors = require('cors');  // Add this import
const { auth } = require('express-openid-connect');
const app = express();
const PORT = 5050;

// CORS setup
app.use(
  cors({
    origin: "http://localhost:5173", // Adjust this to match your frontend URL
    credentials: true,
  }),
);

// Auth0 configuration
const config = {
  authRequired: false,  // Change to true if you want login to be required
  auth0Logout: true,
  secret: 'a long, randomly-generated string stored in env',  // Use a real secret
  baseURL: `http://localhost:${PORT}`,
  clientID: 'HgvOINEf1vwQu8IySdH0vOtvE6hTFLRE',
  issuerBaseURL: 'https://dev-nyglezhgb0zctxph.us.auth0.com',
};



app.use(express.json());

let capturedIp = null;
let geoInfo = null;

app.use(auth(config));

// Routes
app.get("/", (req, res) => {
  if (req.oidc.isAuthenticated()) {
    // Redirect to the frontend app's landing page if authenticated
    return res.redirect("http://localhost:5173/dashboard");
  }
  res.redirect("http://localhost:5173/");
});
const { requiresAuth } = require('express-openid-connect');

app.get('/profile', (req, res) => {
  if (req.oidc && req.oidc.isAuthenticated()) {
    res.json(req.oidc.user);
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
});
app.get('/payment', async (req, res) => {
  capturedIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '8.8.8.8';
  if (capturedIp === '::1' || capturedIp === '127.0.0.1') capturedIp = '8.8.8.8';

  try {
    const geoRes = await fetch(`http://ip-api.com/json/${capturedIp}`);
    geoInfo = await geoRes.json();
  } catch {
    geoInfo = {};
  }

  const startTime = Math.floor(Date.now() / 1000);
  findAndProcessNewCharge(startTime, capturedIp, geoInfo);

  res.redirect('https://buy.stripe.com/test_aEU4go4XjaBN90Y6oo');
});

app.listen(PORT, () => {
  console.log(`✅ Server listening at http://localhost:${PORT}`);
});
