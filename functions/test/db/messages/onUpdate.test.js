const chai = require('chai');
const expect = chai.expect;

// add sinon plugin to chai
const sinonChai = require('sinon-chai');
chai.use(sinonChai);

// add chai-as-promised to chai
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);

// get sinon and create sandbox
const sinon = require('sinon');
const sandbox = sinon.sandbox.create();


describe('dbMessagesOnUpdate function', () => {
    let admin, functions, myFunctions, onceStub, updateStub;

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
    });

    afterEach(() =>  {
        sandbox.restore();
    });

    it('Should update message status in chats', () => {
        // set return value for database once call
        const onceResult = {
            val: () => { return {
                    lastMsgId: 'msg-id'
                };
            }
        };
        onceStub.returns(Promise.resolve(onceResult));
        
        // create fake database update event
        const oldData = {
            senderId: 'sender-id',
            recipientId: 'recipient-id',
            text: 'Text',
            ts: 1234567890,
            type: 'message',
            status: 'delivered'
        };
        const newData = {
            senderId: 'sender-id',
            recipientId: 'recipient-id',
            text: 'Text',
            ts: 1234567890,
            type: 'message',
            status: 'read'
        };
        const fakeEvent = {
            params: {
                chatId: 'chat-id',
                messageId: 'msg-id'
            },
            data: new functions.database.DeltaSnapshot(null, null, oldData, newData),
        };

        return myFunctions.dbMessagesOnUpdate(fakeEvent)
            .then(() => {
                // check the update values
                const expectedUpdateArg = {
                    '/chats/sender-id/chat-id/lastMsgStatus': 'read',
                    '/chats/recipient-id/chat-id/lastMsgStatus': 'read'
                };
                expect(updateStub).to.be.calledWith(expectedUpdateArg);
            });
    });

    it('Should not update message status in chats if the new status is "delivered"', () => {
        // set return value for database once call
        const onceResult = {
            val: () => { return {
                    lastMsgId: 'msg-id'
                };
            }
        };
        onceStub.returns(Promise.resolve(onceResult));
        
        // create fake database update event
        const oldData = {
            senderId: 'sender-id',
            recipientId: 'recipient-id',
            text: 'Text',
            ts: 1234567890,
            type: 'message',
            status: 'sent'
        };
        const newData = {
            senderId: 'sender-id',
            recipientId: 'recipient-id',
            text: 'Text',
            ts: 1234567890,
            type: 'message',
            status: 'delivered'
        };
        const fakeEvent = {
            params: {
                chatId: 'chat-id',
                messageId: 'msg-id'
            },
            data: new functions.database.DeltaSnapshot(null, null, oldData, newData),
        };

        return expect(myFunctions.dbMessagesOnUpdate(fakeEvent)).to.be.eventually.true;
    });

    it('Should not update message status in chats if updated message is not last message', () => {
        // set return value for database once call
        const onceResult = {
            val: () => { return {
                    lastMsgId: 'msg-id'
                };
            }
        };
        onceStub.returns(Promise.resolve(onceResult));
        
        // create fake database update event
        const oldData = {
            senderId: 'sender-id',
            recipientId: 'recipient-id',
            text: 'Text',
            ts: 1234567890,
            type: 'message',
            status: 'delivered'
        };
        const newData = {
            senderId: 'sender-id',
            recipientId: 'recipient-id',
            text: 'Text',
            ts: 1234567890,
            type: 'message',
            status: 'read'
        };
        const fakeEvent = {
            params: {
                chatId: 'chat-id',
                messageId: 'not-last-msg-id'
            },
            data: new functions.database.DeltaSnapshot(null, null, oldData, newData),
        };

        return expect(myFunctions.dbMessagesOnUpdate(fakeEvent)).to.be.eventually.true;
    });
});