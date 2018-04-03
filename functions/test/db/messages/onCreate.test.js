const chai = require('chai');
const expect = chai.expect;

// add sinon plugin to chai
const sinonChai = require('sinon-chai');
chai.use(sinonChai);

// get sinon and create sandbox
const sinon = require('sinon');
const sandbox = sinon.sandbox.create();


describe('dbMessagesOnUpdate function', () => {
    let admin, functions, myFunctions, onceStub, updateStub, adminAppStub;

    // set up stubs
    beforeEach(() => {
        // stub admin.initializeApp
        admin = require('firebase-admin');
        sandbox.stub(admin, 'initializeApp');

        // stub functions config
        functions = require('firebase-functions');
        sandbox.stub(functions, 'config').returns({
            firebase: {
                databaseURL: 'https://not-a-project.firebaseio.com',
                storageBucket: 'not-a-project.appspot.com',
            }
        });

        // get cloud functions
        myFunctions = require('../../../index');

        // stub admin.database().ref().once() call and
        // admin.database().ref().update() call
        onceStub = sandbox.stub();
        updateStub = sandbox.stub().returns(Promise.resolve());
        const refStub = sandbox.stub().returns({
            update: updateStub,
            once: onceStub
        });
        const databaseStub = sandbox.stub(admin, 'database');
        databaseStub.get(() => (() => ({ref: refStub})));

        adminUpdateStub = sandbox.stub().returns(Promise.resolve());
        const adminRefStub = sandbox.stub().returns({
            update: adminUpdateStub
        });
        adminAppStub = {
            database() { return {ref: adminRefStub}; }
        };
    });

    afterEach(() =>  {
        sandbox.restore();
    });

    it('Should create chat nodes when request is sent', () => {
        // set return value for database once call
        const senderResult = {
            ref: {parent: {key: 'sender-id'}},
            val() { return {
                    firstName: 'Sender',
                    photos: ['sender-photo-link'],
                };
            }
        };
        const recipientResult = {
            ref: {parent: {key: 'recipient-id'}},
            val() { return {
                    firstName: 'Recipient',
                    photos: ['recipient-photo-link'],
                };
            }
        };
        onceStub.onFirstCall().returns(Promise.resolve(senderResult));
        onceStub.onSecondCall().returns(Promise.resolve(recipientResult));
        
        // create fake database update event
        const message = {
            senderId: 'sender-id',
            recipientId: 'recipient-id',
            text: 'Text',
            ts: 1234567890,
            type: 'request',
            status: 'sent'
        };
        const fakeEvent = {
            params: {
                chatId: 'chat-id',
                messageId: 'msg-id'
            },
            data: new functions.database.DeltaSnapshot(null, adminAppStub, null, message, '/messages/chat-id/msg-id'),
        };

        return myFunctions.dbMessagesOnCreate(fakeEvent)
            .then(() => {
                // check if message status gets updated
                expect(adminUpdateStub).to.be.calledWith({status: 'delivered'});

                // check the update arguments
                const senderChat = {
                    recipientId: 'recipient-id',
                    recipientName: 'Recipient',
                    recipientUserPhoto: 'recipient-photo-link',
                    status: 'pending',
                    lastMsgId: 'msg-id',
                    lastMsgTs: 1234567890,
                    lastMsgText: 'Text',
                    lastMsgSenderId: 'sender-id',
                    lastMsgStatus: 'delivered',
                    lastMsgType: 'request'
                };
                const recipientChat = {...senderChat};
                recipientChat.recipientId = 'sender-id';
                recipientChat.recipientName = 'Sender';
                recipientChat.recipientUserPhoto = 'sender-photo-link';

                const expectedUpdateArg = {
                    '/chats/sender-id/chat-id': senderChat,
                    '/chats/recipient-id/chat-id': recipientChat
                };
                expect(updateStub).to.be.calledWith(expectedUpdateArg);
            });
    });

    it('Should update chat nodes when approval is sent', () => {
        // create fake database update event
        const message = {
            senderId: 'sender-id',
            recipientId: 'recipient-id',
            text: 'Text',
            ts: 1234567890,
            type: 'approved',
            status: 'sent'
        };
        const fakeEvent = {
            params: {
                chatId: 'chat-id',
                messageId: 'msg-id'
            },
            data: new functions.database.DeltaSnapshot(null, adminAppStub, null, message, '/messages/chat-id/msg-id'),
        };

        return myFunctions.dbMessagesOnCreate(fakeEvent)
            .then(() => {
                // check if message status gets updated
                expect(adminUpdateStub).to.be.calledWith({status: 'delivered'});

                // check the update arguments
                const expectedUpdateArg = {
                    '/chats/sender-id/chat-id/lastMsgId': 'msg-id',
                    '/chats/recipient-id/chat-id/lastMsgId': 'msg-id',
                    '/chats/sender-id/chat-id/lastMsgTs': 1234567890,
                    '/chats/recipient-id/chat-id/lastMsgTs': 1234567890,
                    '/chats/sender-id/chat-id/lastMsgText': 'Text', 
                    '/chats/recipient-id/chat-id/lastMsgText': 'Text', 
                    '/chats/sender-id/chat-id/lastMsgSenderId': 'sender-id',
                    '/chats/recipient-id/chat-id/lastMsgSenderId': 'sender-id',
                    '/chats/sender-id/chat-id/lastMsgStatus': 'delivered',
                    '/chats/recipient-id/chat-id/lastMsgStatus': 'delivered',
                    '/chats/sender-id/chat-id/lastMsgType': 'approved',
                    '/chats/recipient-id/chat-id/lastMsgType': 'approved',
                    '/chats/sender-id/chat-id/status': 'approved',
                    '/chats/recipient-id/chat-id/status': 'approved'
                };
                expect(updateStub).to.be.calledWith(expectedUpdateArg);
            });
    });

    it('Should update chat nodes when denial is sent', () => {
        // create fake database update event
        const message = {
            senderId: 'sender-id',
            recipientId: 'recipient-id',
            text: 'Text',
            ts: 1234567890,
            type: 'denied',
            status: 'sent'
        };
        const fakeEvent = {
            params: {
                chatId: 'chat-id',
                messageId: 'msg-id'
            },
            data: new functions.database.DeltaSnapshot(null, adminAppStub, null, message, '/messages/chat-id/msg-id'),
        };

        return myFunctions.dbMessagesOnCreate(fakeEvent)
            .then(() => {
                // check if message status gets updated
                expect(adminUpdateStub).to.be.calledWith({status: 'delivered'});

                // check the update arguments
                const expectedUpdateArg = {
                    '/chats/sender-id/chat-id/lastMsgId': 'msg-id',
                    '/chats/recipient-id/chat-id/lastMsgId': 'msg-id',
                    '/chats/sender-id/chat-id/lastMsgTs': 1234567890,
                    '/chats/recipient-id/chat-id/lastMsgTs': 1234567890,
                    '/chats/sender-id/chat-id/lastMsgText': 'Text', 
                    '/chats/recipient-id/chat-id/lastMsgText': 'Text', 
                    '/chats/sender-id/chat-id/lastMsgSenderId': 'sender-id',
                    '/chats/recipient-id/chat-id/lastMsgSenderId': 'sender-id',
                    '/chats/sender-id/chat-id/lastMsgStatus': 'delivered',
                    '/chats/recipient-id/chat-id/lastMsgStatus': 'delivered',
                    '/chats/sender-id/chat-id/lastMsgType': 'denied',
                    '/chats/recipient-id/chat-id/lastMsgType': 'denied',
                    '/chats/sender-id/chat-id/status': 'denied',
                    '/chats/recipient-id/chat-id/status': 'denied'
                };
                expect(updateStub).to.be.calledWith(expectedUpdateArg);
            });
    });

    it('Should update chat nodes when message is sent', () => {
        // create fake database update event
        const message = {
            senderId: 'sender-id',
            recipientId: 'recipient-id',
            text: 'Text',
            ts: 1234567890,
            type: 'message',
            status: 'sent'
        };
        const fakeEvent = {
            params: {
                chatId: 'chat-id',
                messageId: 'msg-id'
            },
            data: new functions.database.DeltaSnapshot(null, adminAppStub, null, message, '/messages/chat-id/msg-id'),
        };

        return myFunctions.dbMessagesOnCreate(fakeEvent)
            .then(() => {
                // check if message status gets updated
                expect(adminUpdateStub).to.be.calledWith({status: 'delivered'});

                // check the update arguments
                const expectedUpdateArg = {
                    '/chats/sender-id/chat-id/lastMsgId': 'msg-id',
                    '/chats/recipient-id/chat-id/lastMsgId': 'msg-id',
                    '/chats/sender-id/chat-id/lastMsgTs': 1234567890,
                    '/chats/recipient-id/chat-id/lastMsgTs': 1234567890,
                    '/chats/sender-id/chat-id/lastMsgText': 'Text', 
                    '/chats/recipient-id/chat-id/lastMsgText': 'Text', 
                    '/chats/sender-id/chat-id/lastMsgSenderId': 'sender-id',
                    '/chats/recipient-id/chat-id/lastMsgSenderId': 'sender-id',
                    '/chats/sender-id/chat-id/lastMsgStatus': 'delivered',
                    '/chats/recipient-id/chat-id/lastMsgStatus': 'delivered',
                    '/chats/sender-id/chat-id/lastMsgType': 'message',
                    '/chats/recipient-id/chat-id/lastMsgType': 'message'
                };
                expect(updateStub).to.be.calledWith(expectedUpdateArg);
            });
    });
});