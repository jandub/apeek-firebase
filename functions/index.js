const functions = require('firebase-functions');
const express = require('express');

// const admin = require('firebase-admin');
// admin.initializeApp(functions.config().firebase);

const app = express();
app.get('/', (request, response) => {
    response.send('test');
});

exports.app = functions.https.onRequest(app);