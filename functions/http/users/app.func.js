/**
 *  Creates express app for users endpoint.
 */

const functions = require('firebase-functions');

// middleware
const cors = require('cors');
const auth = require('../middleware/auth');

// init express app
const express = require('express');
const app = express();

app.use(cors({ origin: true }));
app.use(auth);

// routes
const reorderPhotos = require('./photos/reorder');
app.post('/photos/reorder', reorderPhotos);

module.exports = functions.https.onRequest(app);