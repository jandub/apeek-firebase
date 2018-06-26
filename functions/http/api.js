/**
 *  Creates express app for users endpoint.
 */

const functions = require('firebase-functions');

// middleware
const cors = require('cors');
const auth = require('./middleware/auth');

// init express app
const express = require('express');
const app = express();

app.use(cors({ origin: true }));
app.use(auth);

// routes
app.post('/users/photos/order', require('./users/photos/order'));

module.exports = functions.https.onRequest(app);