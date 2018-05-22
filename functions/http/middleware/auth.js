/**
 *  Authorization middleware
 *  Checks the token sent in headers with firebase and
 *  adds decoded data to request object.
 *
 *  Token needs to be sent using key "Authorization" with
 *  value equal to "Bearer <token>".
 */

// admin SDK can be only initialized once, wrap in try-catch
const admin = require('firebase-admin');
try {
    admin.initializeApp();
    // eslint-disable-next-line no-empty
} catch (e) { }


module.exports = (req, res, next) => {
    let idToken;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        idToken = req.headers.authorization.split('Bearer ')[1];
    } else {
        res.status(401).send('Unauthorized');
        return false;
    }

    return admin.auth().verifyIdToken(idToken)
        .then(decodedIdToken => {
            req.user = decodedIdToken;
            return next();
        }).catch(error => {
            res.status(401).send('Unauthorized');
        });
};