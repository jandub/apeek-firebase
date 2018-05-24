/*
 *  Initialize admin SDK for firebase
 */

const admin = require('firebase-admin');
admin.initializeApp();

module.exports = admin;