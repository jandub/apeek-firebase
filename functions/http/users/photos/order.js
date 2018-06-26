/**
 *  Http function to reorder users photos.
 *
 *  Method: POST
 *  Endpoint: /users/photos/order
 *  Params:
 *      order   Array of integers - new order of photos
 *              Example: [3, 2, 1] for authenticated user
 *                  with three photos in db
 */

const admin = require('../../../admin');

const consts = require('../../../constants');


module.exports = (req, res) => {
    // check params
    if (!validateParams(req.body)) {
        res.status(403).send('Wrong parameters.');
        return false;
    }

    const { uid: userId } = req.user;
    const { order } = req.body;
    const ref = admin.database().ref(`/users/${userId}/photos`);

    return ref.once('value')
        .then(photosSnap => {
            let photos = photosSnap.val();

            // no photos to reorder
            if (!photos) {
                return true;
            }

            if (photos.length !== order.length) {
                throw new Error('Wrong parameters.');
            }

            // reorder photos
            photos = order.map(pos => photos[pos - 1]);

            return ref.set(photos);
        })
        .then(() => {
            res.status(200).send(true);
        })
        .catch(err => {
            res.status(403).send(err.message);
        });
};

const validateParams = params => {
    if (params.order) {
        const { order } = params;

        if (Array.isArray(order) && order.length <= consts.USER_PHOTOS_MAX) {
            // check that values are unique and sequential
            return order.every((val, idx, arr) => arr.includes(idx + 1));
        }
    }

    return false;
};