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

// initialize firebase sdk
const test = require('firebase-functions-test')();


describe('dbMessagesOnUpdate function', () => {
    let admin, functions, myFunctions, onceStub, updateStub;

    // set up stubs
    beforeEach(() => {
        // stub admin.initializeApp
        admin = require('firebase-admin');
        sandbox.stub(admin, 'initializeApp');

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
        test.cleanup();
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
        const beforeData = {
            senderId: 'sender-id',
            recipientId: 'recipient-id',
            text: 'Text',
            ts: 1234567890,
            type: 'message',
            status: 'delivered'
        };
        const afterData = {
            senderId: 'sender-id',
            recipientId: 'recipient-id',
            text: 'Text',
            ts: 1234567890,
            type: 'message',
            status: 'read'
        };
        const beforeSnap = test.database.makeDataSnapshot(beforeData);
        const afterSnap = test.database.makeDataSnapshot(afterData);

        const change = test.makeChange(beforeSnap, afterSnap);
        const context = {
            params: {
                chatId: 'chat-id',
                messageId: 'msg-id'
            }
        };

        const wrapped = test.wrap(myFunctions.dbMessagesOnUpdate);

        return wrapped(change, context)
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
        const beforeData = {
            senderId: 'sender-id',
            recipientId: 'recipient-id',
            text: 'Text',
            ts: 1234567890,
            type: 'message',
            status: 'sent'
        };
        const afterData = {
            senderId: 'sender-id',
            recipientId: 'recipient-id',
            text: 'Text',
            ts: 1234567890,
            type: 'message',
            status: 'delivered'
        };
        const beforeSnap = test.database.makeDataSnapshot(beforeData);
        const afterSnap = test.database.makeDataSnapshot(afterData);

        const change = test.makeChange(beforeSnap, afterSnap);
        const context = {
            params: {
                chatId: 'chat-id',
                messageId: 'msg-id'
            }
        };

        const wrapped = test.wrap(myFunctions.dbMessagesOnUpdate);

        return expect(wrapped(change, context)).to.be.true;
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
        const beforeData = {
            senderId: 'sender-id',
            recipientId: 'recipient-id',
            text: 'Text',
            ts: 1234567890,
            type: 'message',
            status: 'delivered'
        };
        const afterData = {
            senderId: 'sender-id',
            recipientId: 'recipient-id',
            text: 'Text',
            ts: 1234567890,
            type: 'message',
            status: 'read'
        };
        const beforeSnap = test.database.makeDataSnapshot(beforeData);
        const afterSnap = test.database.makeDataSnapshot(afterData);

        const change = test.makeChange(beforeSnap, afterSnap);
        const context = {
            params: {
                chatId: 'chat-id',
                messageId: 'not-last-msg-id'
            }
        };

        const wrapped = test.wrap(myFunctions.dbMessagesOnUpdate);

        return expect(wrapped(change, context)).to.be.eventually.true;
    });
});