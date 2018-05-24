/*
 *  Triggers when a file is deleted from the storage.
 *
 *  This function removes the link from the user's profile
 *  in the database.
 */

const functions = require('firebase-functions');
const admin = require('../admin');

const consts = require('../constants');


module.exports = functions.storage.object().onDelete((object, context) => {
    const filePath = object.name;

    // validate path - expects user_photos/${user_uid}/${filename}
    const pathParts = filePath.split('/');

    if (pathParts.length !== 3 || pathParts[0] !== consts.STORAGE_PHOTOS || !pathParts[2].length) {
        // not a user profile photo upload
        return true;
    }

    const db = admin.database();
    const userId = pathParts[1];

    return db.ref(`/users/${userId}/photos`).once('value')
        .then(snapshot => {
            const userPhotos = snapshot.val();
            const link = `gs://${object.bucket}/${object.name}`;
            const idx = userPhotos.indexOf(link);

            if (idx !== -1) {
                userPhotos.splice(idx, 1);
            }

            return db.ref(`/users/${userId}/photos`).set(userPhotos);
        });
});