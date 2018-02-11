/**
 *  Triggers when a new message is created
 *  Changes the status of message to 'delivered'
 *  Preforms different actions depending on the type of the message 
 *  Supported types: request|message|approved|denied
 *  
 *  Request
 *  Request for chatting. Creates a chat node for both users in
 *  /chats/{senderId}/{chatId} and /chats/{receiverId}/{chatId} with 
 *  chat status set to pending.
 *  
 *  Message
 *  Updates the chat nodes with the last message information -
 *  text, sender and timestamp.
 *  
 *  Approved/Denied
 *  Approves or denies the request for chatting. Updates the status of 
 *  chat nodes to approved/denied.
 */

const functions = require('firebase-functions');

// admin SDK can be only initialized once, wrap in try-catch
const admin = require('firebase-admin');
try {
    admin.initializeApp(functions.config().firebase);
} catch (e) {}

const consts = require('../../constants');


module.exports = functions.database
    .ref('/messages/{chatId}/{messageId}')
    .onCreate(event => {
        return markAsDelivered(event)
            .then(() => {
                return handleEvent(event)
            });
    });

const markAsDelivered = event => {
    const msg = event.data.val();
    msg.status = consts.MSG_STATUS_DELIVERED;

    return event.data.ref.update(msg);
}

const handleEvent = event => {
    const msg = event.data.val();

    switch (msg.type) {
        case consts.MSG_TYPE_REQUEST:
            return handleRequest(event);
        case consts.MSG_TYPE_APPROVED:
            break;
        case consts.MSG_TYPE_DENIED:
            break;
        case consts.MSG_TYPE_MESSAGE:
            break;
    }
}

const handleRequest = event => {
    const db = admin.database();
    const msg = event.data.val();
    const chatId = event.params.chatId;

    let senderSnap = null;
    let recipientSnap = null;

    return db.ref(`/users/${msg.senderId}`).once('value')
        .then(snapshot => {
            senderSnap = snapshot;
            return db.ref(`/users/${msg.recipientId}`).once('value');
        })
        .then(snapshot => {
            recipientSnap = snapshot;

            const chatRef = db.ref(`/chats/${msg.recipientId}`);
            const chatToSave = getNewChatObject(msg.senderId, senderSnap, msg);

            return chatRef.set({chatId: chatToSave});
        })
        .then(() => {
            const chatRef = db.ref(`/chats/${msg.senderId}`);
            const chatToSave = getNewChatObject(msg.recipientId, recipientSnap, msg);

            return chatRef.set({chatId: chatToSave});
        });
};

const getNewChatObject = (userId, userSnap, msg) => {
    const user = userSnap.val();

    return {
        'recipientId': userId,
        'recipientName': user.firstName,
        'recipientUserPhoto': user.photos[0],
        'status': consts.CHAT_STATUS_PENDING,
        'lastMsgTs': msg.ts,
        'lastMsgText': msg.text,
        'lastMsgSenderId': msg.senderId
    };
};