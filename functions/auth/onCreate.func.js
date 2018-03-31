/*
 *  Triggers when a new user logs into Firebase
 *  and his authentication account is created.
 *
 *  This function gets users profile photo from Facebook and
 *  saves it to cloud storage. Then it creates new user
 *  profile in database.
 */

const functions = require('firebase-functions');

// admin SDK can be only initialized once, wrap in try-catch
const admin = require('firebase-admin');
try {
    admin.initializeApp(functions.config().firebase);
} catch(e) {}


const consts = require('../constants');

const uuid = require('uuid');
const axios = require('axios');


module.exports = functions.auth
    .user()
    .onCreate(event => {
        const user = event.data;

        return saveProfilePhoto(user)
            .then(photoLink => {
                return createNewUser(user, photoLink);
            });
    });

const createNewUser = (user, photoLink) => {
    const db = admin.database();

    const displayName = user.displayName.split(' ');
    const firstName = displayName.shift();
    const lastName = displayName.join(' ');

    const newUser = {
        profile: {
            firstName,
            lastName,
            gender: user.gender || null,
            about: '',
            interests: '',
            photos: [photoLink]
        },
        meta: {
            email: user.email,
        },
    };

    return db.ref(`users/${user.uid}`).set(newUser);
};

const saveProfilePhoto = user => {
    // Use Facebook API to get the profile photo
    // See https://developers.facebook.com/docs/graph-api/reference/user/picture/
    // Using type=large returns image with dimensions 200x200
    // Using width=9999 returns the maximum dimensions
    const facebookId = user.providerData[0].uid;
    const fbLink = `http://graph.facebook.com/${facebookId}/picture?width=9999&redirect=false`;

    return axios.get(fbLink)
        .then(response => {
            const url = response.data.data.url;
            const isSilhouette = response.data.data.is_silhouette;

            // facebook user has no profile photo
            if (isSilhouette) {
                return null;
            }

            return saveUrlToBucket(user.uid, url);
        })
        .catch(err => {
            // failed to get response from FB api or to save file to bucket
            console.log(err);
            return null;
        });
};

const saveUrlToBucket = (userId, url) => {
    const bucketName = functions.config().firebase.storageBucket;
    const bucket = admin.storage().bucket(bucketName);
    const fileId = uuid.v4();
    const options = {
        destination: `${consts.STORAGE_PHOTOS}/${userId}/${fileId}.jpg`,
    };

    return bucket.upload(url, options)
        .then(result => {
            const fileData = result[0].metadata;
            return `gs://${fileData.bucket}/${fileData.name}`;
        });
};