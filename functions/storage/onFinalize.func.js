/*
 *  Triggers when a file is added to the storage.
 *
 *  This function links the file with the user's profile
 *  in the database.
 */

const functions = require('firebase-functions');

// admin SDK can be only initialized once, wrap in try-catch
const admin = require('firebase-admin');
try {
    admin.initializeApp();
// eslint-disable-next-line no-empty
} catch (e) {}


const consts = require('../constants');


module.exports = functions.storage.object().onFinalize((object, context) => {
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
            // cant save empty array in firebase
            // returns null if user has no photos
            let userPhotos = snapshot.val() || [];

            // user has already maximum amount of photos
            if (userPhotos.length === consts.USER_PHOTOS_MAX) {
                return deleteFile(filePath);
            }

            userPhotos = getUpdatedUserPhotos(userPhotos, object);

            return db.ref(`/users/${userId}/photos`).set(userPhotos);
        });
});

const deleteFile = path => {
    const firebaseConfig = JSON.parse(process.env.FIREBASE_CONFIG);
    const bucketName = firebaseConfig.storageBucket;
    const bucket = admin.storage().bucket(bucketName);

    return bucket.file(path).delete();
};

const getUpdatedUserPhotos = (photos, object) => {
    const link = `gs://${object.bucket}/${object.name}`;
    const position = getPositionFromMeta(object.metadata);

    if (!position || position > photos.length) {
        photos.push(link);
    } else {
        photos.splice(position - 1, 0, link);
    }

    return photos;
};

const getPositionFromMeta = meta => {
    if (meta && meta.position) {
        const pos = parseInt(meta.position, 10);

        if (pos > 0 && pos <= consts.USER_PHOTOS_MAX) {
            return pos;
        }
    }

    return null;
};