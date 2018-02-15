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
 *  Message
 *  Updates the chat nodes with the last message information -
 *  text, sender and timestamp.
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

    return event.data.adminRef.update(msg);
}

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

            const chatToSave = {};
            chatToSave[chatId] = getNewChatObject(senderSnap, msg);

            return db.ref(`/chats/${msg.recipientId}`).set(chatToSave);
        })
        .then(() => {
            const chatToSave = {};
            chatToSave[chatId] = getNewChatObject(recipientSnap, msg);

            return db.ref(`/chats/${msg.senderId}`).set(chatToSave);
        });
};

const getNewChatObject = (userSnap, msg) => {
    const user = userSnap.val();
    const userId = userSnap.key;

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

    return db.ref(`/chats/${msg.senderId}/${chatId}`).once('value')
        .then(chatSnap => {
            const chat = getUpdatedChatObject(chatSnap, msg, newStatus); 

            return chatSnap.ref.update(chat);
        })
        .then(() => {
            return db.ref(`/chats/${msg.recipientId}/${chatId}`).once('value');
        })
        .then(chatSnap => {
            const chat = getUpdatedChatObject(chatSnap, msg, newStatus); 

            return chatSnap.ref.update(chat);
        });
};

const getUpdatedChatObject = (chatSnap, msg, newStatus) => {
    const chat = chatSnap.val();

    if (newStatus) {
        chat.status = newStatus;
    }

    chat.lastMsgTs = msg.ts;
    chat.lastMsgText = msg.text;
    chat.lastMsgSenderId = msg.senderId;

    return chat;
};