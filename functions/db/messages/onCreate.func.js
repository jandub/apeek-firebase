/**
 *  Triggers when a new message is created
 *  Changes the status of message to 'delivered'
 *  Preforms different actions depending on the type of the message 
 *  Supported types: request|message|approved|denied
 *  
 *  Request
 *  Request for chatting. Creates a chat node for both users in
 *  /chats/{senderId}/{chatId} and /chats/{recipientId}/{chatId} with 
 *  chat status set to pending.
 *  
 *  Approved/Denied
 *  Approves or denies the request for chatting. Updates the status of 
 *  chat nodes to approved/denied.
 *  
 *  All messages
 *  Updates the chat nodes with the last message information -
 *  text, sender, timestamp and status.
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
    return event.data.adminRef.update({status: consts.MSG_STATUS_DELIVERED});
};

const handleEvent = event => {
    const msg = event.data.val();

    switch (msg.type) {
        case consts.MSG_TYPE_REQUEST:
            return handleRequest(event);
        case consts.MSG_TYPE_APPROVED:
            return handleApproved(event);
        case consts.MSG_TYPE_DENIED:
            return handleDenied(event);
        case consts.MSG_TYPE_MESSAGE:
            return handleMessage(event);
    }
};

const handleRequest = event => {
    const db = admin.database();
    const msg = event.data.val();
    const chatId = event.params.chatId;

    let senderSnap = null;
    let recipientSnap = null;

    return db.ref(`/users/${msg.senderId}/profile`).once('value')
        .then(snapshot => {
            senderSnap = snapshot;
            return db.ref(`/users/${msg.recipientId}/profile`).once('value');
        })
        .then(snapshot => {
            recipientSnap = snapshot;

            const chatToSave = getNewChatObject(senderSnap, msg);
            return db.ref(`/chats/${msg.recipientId}/${chatId}`).set(chatToSave);
        })
        .then(() => {
            const chatToSave = getNewChatObject(recipientSnap, msg);
            return db.ref(`/chats/${msg.senderId}/${chatId}`).set(chatToSave);
        });
};

const getNewChatObject = (userSnap, msg) => {
    const user = userSnap.val();
    const userId = userSnap.ref.parent.key;
    let photo = null;

    if (!!user.photos && !!user.photos[0]) {
        photo = user.photos[0];
    }

    return {
        recipientId: userId,
        recipientName: user.firstName,
        recipientUserPhoto: photo,
        status: consts.CHAT_STATUS_PENDING,
        lastMsgTs: msg.ts,
        lastMsgText: msg.text,
        lastMsgSenderId: msg.senderId,
        lastMsgStatus: consts.MSG_STATUS_DELIVERED
    };
};

const handleApproved = event => {
    return updateChats(event, consts.CHAT_STATUS_APPROVED);
};

const handleDenied = event => {
    return updateChats(event, consts.CHAT_STATUS_DENIED);
};

const handleMessage = event => {
    return updateChats(event);
};

const updateChats = (event, newStatus = null) => {
    const db = admin.database();
    const chatId = event.params.chatId;
    const msg = event.data.val();

    const chat = getUpdateChatObject(msg, newStatus); 

    return db.ref(`/chats/${msg.senderId}/${chatId}`).update(chat)
        .then(() => {
            return db.ref(`/chats/${msg.recipientId}/${chatId}`).update(chat);
        });
};

const getUpdateChatObject = (msg, newStatus) => {
    const chat = {
        lastMsgTs: msg.ts,
        lastMsgText: msg.text,
        lastMsgSenderId: msg.senderId,
        lastMsgStatus: consts.MSG_STATUS_DELIVERED
    };

    if (newStatus) {
        chat.status = newStatus;
    }

    return chat;
};