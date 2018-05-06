const chai = require('chai');
const { expect } = chai;

// add targaryen plugin to chai
const targaryen = require('targaryen/plugins/chai');
chai.use(targaryen);

// load constants
const { PATH_CONSTS } = require('./paths');
const consts = require.main.require(PATH_CONSTS);

// add firebase rules
const rules = targaryen.json.loadSync('database/database.rules.json');
targaryen.setFirebaseRules(rules);

// load testing data
const usersNode = require('./data/users');
const chatsMsgsPendingNodes = require('./data/chats-msgs-pending');
const chatsMsgsApprovedNodes = require('./data/chats-msgs-approved');
const chatsMsgsDeniedNodes = require('./data/chats-msgs-denied');


// helper function that returns valid message
const getMessage = (type, senderId = 'user1', recipientId = 'user2') => {
    return {
        senderId,
        recipientId,
        ts: 1234567890,
        text: '',
        type,
        status: consts.MSG_STATUS_SENT
    };
};


describe('Messages - rules', () => {
    describe('Read', () => {
        before(() => {
            const data = Object.assign({}, usersNode, chatsMsgsPendingNodes);
            targaryen.setFirebaseData(data);
        });

        describe('All records', () => {
            it('Should not allow anonymous user to read all messages in chat', () => {
                expect(null).cannot.read.path('/messages/chat_id');
            });

            it('Should allow authenticated user to read all messages if in the chat', () => {
                expect({ uid: 'user1' }).can.read.path('/messages/chat_id');
                expect({ uid: 'user2' }).can.read.path('/messages/chat_id');
            });

            it('Should not allow authenticated user to read all messages if not in chat', () => {
                expect({ uid: 'user3' }).cannot.read.path('/messages/chat_id');
            });
        });

        describe('Single record', () => {
            it('Should not allow anonymous user to read the message', () => {
                expect(null).cannot.read.path('/messages/chat_id/msg_req_id');
            });

            it('Should allow authenticated user to read message if in the chat', () => {
                expect({ uid: 'user1' }).can.read.path('/messages/chat_id/msg_req_id');
                expect({ uid: 'user2' }).can.read.path('/messages/chat_id/msg_req_id');
            });

            it('Should not allow authenticated user to read the message if not in chat', () => {
                expect({ uid: 'user3' }).cannot.read.path('/messages/chat_id/msg_req_id');
            });
        });
    });

    describe('Create', () => {
        describe('General', () => {
            before(() => {
                targaryen.setFirebaseData(usersNode);
            });

            it('Should not allow anonymous user to create a message', () => {
                const msg = getMessage(consts.MSG_TYPE_REQUEST);

                expect(null).cannot.write(msg).path('/messages/chat_id/msg_req_id');
            });

            it('Should not allow user to create a message where she is not the sender', () => {
                const msg = getMessage(consts.MSG_TYPE_REQUEST);

                expect({ uid: 'user2' }).cannot.write(msg).path('/messages/chat_id/msg_req_id');
                expect({ uid: 'user3' }).cannot.write(msg).path('/messages/chat_id/msg_req_id');
            });

            it('Should not allow user to create a message where status is not "sent"', () => {
                const msg = getMessage(consts.MSG_TYPE_REQUEST);

                msg.status = consts.MSG_STATUS_DELIVERED;
                expect({ uid: 'user1' }).cannot.write(msg).path('/messages/chat_id/msg_req_id');

                msg.status = consts.MSG_STATUS_READ;
                expect({ uid: 'user1' }).cannot.write(msg).path('/messages/chat_id/msg_req_id');
            });

            it('Should not allow user to create a message where sender and recipient is the same"', () => {
                const msg = getMessage(consts.MSG_TYPE_REQUEST, 'user1', 'user1');

                expect({ uid: 'user1' }).cannot.write(msg).path('/messages/chat_id/msg_req_id');
            });
        });

        describe('With no chats', () => {
            before(() => {
                targaryen.setFirebaseData(usersNode);
            });

            it('Should allow user to create a chat request', () => {
                const msg = getMessage(consts.MSG_TYPE_REQUEST);
                const msg2 = getMessage(consts.MSG_TYPE_REQUEST, 'user2', 'user1');

                expect({ uid: 'user1' }).can.write(msg).path('/messages/chat_id/msg_req_id');
                expect({ uid: 'user2' }).can.write(msg2).path('/messages/chat_id/msg_req_id');
            });

            it('Should not allow user to approve chat that does not exist', () => {
                const msg = getMessage(consts.MSG_TYPE_APPROVED);
                const msg2 = getMessage(consts.MSG_TYPE_APPROVED, 'user2', 'user1');

                expect({ uid: 'user1' }).cannot.write(msg).path('/messages/chat_id/msg_app_id');
                expect({ uid: 'user2' }).cannot.write(msg2).path('/messages/chat_id/msg_app_id');
            });

            it('Should not allow user to deny chat that does not exist', () => {
                const msg = getMessage(consts.MSG_TYPE_DENIED);
                const msg2 = getMessage(consts.MSG_TYPE_DENIED, 'user2', 'user1');

                expect({ uid: 'user1' }).cannot.write(msg).path('/messages/chat_id/msg_den_id');
                expect({ uid: 'user2' }).cannot.write(msg2).path('/messages/chat_id/msg_den_id');
            });

            it('Should not allow user to add message to chat that does not exist', () => {
                const msg = getMessage(consts.MSG_TYPE_MESSAGE);
                const msg2 = getMessage(consts.MSG_TYPE_MESSAGE, 'user2', 'user1');

                expect({ uid: 'user1' }).cannot.write(msg).path('/messages/chat_id/msg_id');
                expect({ uid: 'user2' }).cannot.write(msg2).path('/messages/chat_id/msg_id');
            });
        });


        describe('With chat pending', () => {
            before(() => {
                const data = Object.assign({}, usersNode, chatsMsgsPendingNodes);
                targaryen.setFirebaseData(data);
            });

            it('Should allow user to approve chat request', () => {
                const msg = getMessage(consts.MSG_TYPE_APPROVED, 'user2', 'user1');

                expect({ uid: 'user2' }).can.write(msg).path('/messages/chat_id/msg_app_id');
            });

            it('Should not allow user to approve chat requested by herself', () => {
                const msg = getMessage(consts.MSG_TYPE_APPROVED);

                expect({ uid: 'user1' }).cannot.write(msg).path('/messages/chat_id/msg_app_id');
            });

            it('Should allow user to deny chat request', () => {
                const msg = getMessage(consts.MSG_TYPE_DENIED, 'user2', 'user1');

                expect({ uid: 'user2' }).can.write(msg).path('/messages/chat_id/msg_den_id');
            });

            it('Should not allow user to deny chat requested by herself', () => {
                const msg = getMessage(consts.MSG_TYPE_DENIED);

                expect({ uid: 'user1' }).cannot.write(msg).path('/messages/chat_id/msg_den_id');
            });

            it('Should not allow user to create second request to other user', () => {
                const msg = getMessage(consts.MSG_TYPE_REQUEST);
                const msg2 = getMessage(consts.MSG_TYPE_REQUEST, 'user2', 'user1');

                expect({ uid: 'user1' }).cannot.write(msg).path('/messages/chat_id/msg_req2_id');
                expect({ uid: 'user2' }).cannot.write(msg2).path('/messages/chat_id/msg_req2_id');
            });

            it('Should not allow user to add message to pending chat', () => {
                const msg = getMessage(consts.MSG_TYPE_MESSAGE);
                const msg2 = getMessage(consts.MSG_TYPE_MESSAGE, 'user2', 'user1');

                expect({ uid: 'user1' }).cannot.write(msg).path('/messages/chat_id/msg_id');
                expect({ uid: 'user2' }).cannot.write(msg2).path('/messages/chat_id/msg_id');
            });
        });


        describe('With chat denied', () => {
            before(() => {
                const data = Object.assign({}, usersNode, chatsMsgsDeniedNodes);
                targaryen.setFirebaseData(data);
            });

            it('Should not allow user to deny chat twice', () => {
                const msg = getMessage(consts.MSG_TYPE_DENIED);
                const msg2 = getMessage(consts.MSG_TYPE_DENIED, 'user2', 'user1');

                expect({ uid: 'user1' }).cannot.write(msg).path('/messages/chat_id/msg_den2_id');
                expect({ uid: 'user2' }).cannot.write(msg2).path('/messages/chat_id/msg_den2_id');
            });

            it('Should not allow user to approve chat that is denied', () => {
                const msg = getMessage(consts.MSG_TYPE_APPROVED);
                const msg2 = getMessage(consts.MSG_TYPE_APPROVED, 'user2', 'user1');

                expect({ uid: 'user1' }).cannot.write(msg).path('/messages/chat_id/msg_app_id');
                expect({ uid: 'user2' }).cannot.write(msg2).path('/messages/chat_id/msg_app_id');
            });

            it('Should not allow user to create request if the chat is denied', () => {
                const msg = getMessage(consts.MSG_TYPE_REQUEST);
                const msg2 = getMessage(consts.MSG_TYPE_REQUEST, 'user2', 'user1');

                expect({ uid: 'user1' }).cannot.write(msg).path('/messages/chat_id/msg_req2_id');
                expect({ uid: 'user2' }).cannot.write(msg2).path('/messages/chat_id/msg_req2_id');
            });

            it('Should not allow user to add message to denied chat', () => {
                const msg = getMessage(consts.MSG_TYPE_MESSAGE);
                const msg2 = getMessage(consts.MSG_TYPE_MESSAGE, 'user2', 'user1');

                expect({ uid: 'user1' }).cannot.write(msg).path('/messages/chat_id/msg_id');
                expect({ uid: 'user2' }).cannot.write(msg2).path('/messages/chat_id/msg_id');
            });
        });


        describe('With chat approved', () => {
            before(() => {
                const data = Object.assign({}, usersNode, chatsMsgsApprovedNodes);
                targaryen.setFirebaseData(data);
            });

            it('Should allow user to add messages to chat', () => {
                const msg = getMessage(consts.MSG_TYPE_MESSAGE);
                const msg2 = getMessage(consts.MSG_TYPE_MESSAGE, 'user2', 'user1');

                expect({ uid: 'user1' }).can.write(msg).path('/messages/chat_id/msg_id');
                expect({ uid: 'user2' }).can.write(msg2).path('/messages/chat_id/msg_id');
            });

            it('Should not allow user to approve chat twice', () => {
                const msg = getMessage(consts.MSG_TYPE_APPROVED);
                const msg2 = getMessage(consts.MSG_TYPE_APPROVED, 'user2', 'user1');

                expect({ uid: 'user1' }).cannot.write(msg).path('/messages/chat_id/msg_app2_id');
                expect({ uid: 'user2' }).cannot.write(msg2).path('/messages/chat_id/msg_app2_id');
            });

            it('Should not allow user to deny approved chat', () => {
                const msg = getMessage(consts.MSG_TYPE_DENIED);
                const msg2 = getMessage(consts.MSG_TYPE_DENIED, 'user2', 'user1');

                expect({ uid: 'user1' }).cannot.write(msg).path('/messages/chat_id/msg_den_id');
                expect({ uid: 'user2' }).cannot.write(msg2).path('/messages/chat_id/msg_den_id');
            });

            it('Should not allow user to create request if the chat is approved', () => {
                const msg = getMessage(consts.MSG_TYPE_REQUEST);
                const msg2 = getMessage(consts.MSG_TYPE_REQUEST, 'user2', 'user1');

                expect({ uid: 'user1' }).cannot.write(msg).path('/messages/chat_id/msg_req2_id');
                expect({ uid: 'user2' }).cannot.write(msg2).path('/messages/chat_id/msg_req2_id');
            });
        });
    });

    describe('Update', () => {
        before(() => {
            const data = Object.assign({}, usersNode, chatsMsgsPendingNodes);
            targaryen.setFirebaseData(data);
        });

        it('Should not allow anonymous user to update message', () => {
            const msg = getMessage(consts.MSG_TYPE_REQUEST);
            msg.status = consts.MSG_STATUS_READ;

            expect(null).cannot.patch(msg).path('/messages/chat_id/msg_req_id');
        });

        it('Should not allow authenticated user to update message where she is not a recipient', () => {
            const msg = getMessage(consts.MSG_TYPE_REQUEST);
            msg.status = consts.MSG_STATUS_READ;

            expect({ uid: 'user1' }).cannot.patch(msg).path('/messages/chat_id/msg_req_id');
            expect({ uid: 'user3' }).cannot.patch(msg).path('/messages/chat_id/msg_req_id');
        });

        it('Should allow authenticated user to update the status of message from "delivered" to "read"', () => {
            const msg = getMessage(consts.MSG_TYPE_REQUEST);
            msg.status = consts.MSG_STATUS_READ;

            expect({ uid: 'user2' }).can.patch(msg).path('/messages/chat_id/msg_req_id');
        });

        it('Should not allow user to update the senderId', () => {
            const msg = getMessage(consts.MSG_TYPE_REQUEST);
            msg.status = consts.MSG_STATUS_READ;
            msg.senderId = 'user3';

            expect({ uid: 'user2' }).cannot.patch(msg).path('/messages/chat_id/msg_req_id');
        });

        it('Should not allow user to update the recipientId', () => {
            const msg = getMessage(consts.MSG_TYPE_REQUEST);
            msg.status = consts.MSG_STATUS_READ;
            msg.recipientId = 'user3';

            expect({ uid: 'user2' }).cannot.patch(msg).path('/messages/chat_id/msg_req_id');
        });

        it('Should not allow user to update the timestamp', () => {
            const msg = getMessage(consts.MSG_TYPE_REQUEST);
            msg.status = consts.MSG_STATUS_READ;
            msg.ts = 12345678999;

            expect({ uid: 'user2' }).cannot.patch(msg).path('/messages/chat_id/msg_req_id');
        });

        it('Should not allow user to update the text', () => {
            const msg = getMessage(consts.MSG_TYPE_REQUEST);
            msg.status = consts.MSG_STATUS_READ;
            msg.text = 'Another text message...';

            expect({ uid: 'user2' }).cannot.patch(msg).path('/messages/chat_id/msg_req_id');
        });

        it('Should not allow user to update the type', () => {
            const msg = getMessage(consts.MSG_TYPE_REQUEST);
            msg.status = consts.MSG_STATUS_READ;
            msg.type = consts.MSG_TYPE_MESSAGE;

            expect({ uid: 'user2' }).cannot.patch(msg).path('/messages/chat_id/msg_req_id');
        });

        it('Should not allow user to update the status from "delivered" to "sent"', () => {
            const msg = getMessage(consts.MSG_TYPE_REQUEST);
            msg.status = consts.MSG_STATUS_SENT;

            expect({ uid: 'user2' }).cannot.patch(msg).path('/messages/chat_id/msg_req_id');
        });
    });


    describe('Delete', () => {
        before(() => {
            const data = Object.assign({}, usersNode, chatsMsgsPendingNodes);
            targaryen.setFirebaseData(data);
        });

        it('Should not allow anonymous user to delete message', () => {
            expect(null).cannot.write(null).path('/messages/chat_id/msg_req_id');
        });

        it('Should not allow authenticated user to delete message', () => {
            expect({ uid: 'user1' }).cannot.write(null).path('/messages/chat_id/msg_req_id');
            expect({ uid: 'user2' }).cannot.write(null).path('/messages/chat_id/msg_req_id');
        });
    });


    describe('Validation', () => {
        before(() => {
            targaryen.setFirebaseData(usersNode);
        });

        it('Should validate senderId', () => {
            const msg = getMessage(consts.MSG_TYPE_REQUEST);

            msg.senderId = null;
            expect({ uid: 'user1' }).cannot.write(msg).path('/messages/chat_id/msg_req_id');

            msg.senderId = 'user4';
            expect({ uid: 'user4' }).cannot.write(msg).path('/messages/chat_id/msg_req_id');
        });

        it('Should validate recipientId', () => {
            const msg = getMessage(consts.MSG_TYPE_REQUEST);

            msg.recipientId = null;
            expect({ uid: 'user1' }).cannot.write(msg).path('/messages/chat_id/msg_req_id');

            msg.recipientId = 'user4';
            expect({ uid: 'user1' }).cannot.write(msg).path('/messages/chat_id/msg_req_id');
        });

        it('Should validate text', () => {
            const msg = getMessage(consts.MSG_TYPE_REQUEST);

            msg.text = null;
            expect({ uid: 'user1' }).cannot.write(msg).path('/messages/chat_id/msg_req_id');

            msg.text = 123;
            expect({ uid: 'user1' }).cannot.write(msg).path('/messages/chat_id/msg_req_id');

            msg.text = { test: 'data' };
            expect({ uid: 'user1' }).cannot.write(msg).path('/messages/chat_id/msg_req_id');
        });

        it('Should validate timestamp', () => {
            const msg = getMessage(consts.MSG_TYPE_REQUEST);

            msg.ts = null;
            expect({ uid: 'user1' }).cannot.write(msg).path('/messages/chat_id/msg_req_id');

            msg.ts = '123';
            expect({ uid: 'user1' }).cannot.write(msg).path('/messages/chat_id/msg_req_id');

            msg.ts = { test: 'data' };
            expect({ uid: 'user1' }).cannot.write(msg).path('/messages/chat_id/msg_req_id');

            msg.ts = -123;
            expect({ uid: 'user1' }).cannot.write(msg).path('/messages/chat_id/msg_req_id');

            msg.ts = Date.now + 999;
            expect({ uid: 'user1' }).cannot.write(msg).path('/messages/chat_id/msg_req_id');
        });

        it('Should validate status', () => {
            const msg = getMessage(consts.MSG_TYPE_REQUEST);

            msg.status = null;
            expect({ uid: 'user1' }).cannot.write(msg).path('/messages/chat_id/msg_req_id');

            msg.status = 123;
            expect({ uid: 'user1' }).cannot.write(msg).path('/messages/chat_id/msg_req_id');

            msg.status = 'abc';
            expect({ uid: 'user1' }).cannot.write(msg).path('/messages/chat_id/msg_req_id');

            msg.status = { test: 'data' };
            expect({ uid: 'user1' }).cannot.write(msg).path('/messages/chat_id/msg_req_id');
        });

        it('Should validate type', () => {
            const msg = getMessage(consts.MSG_TYPE_REQUEST);

            msg.type = null;
            expect({ uid: 'user1' }).cannot.write(msg).path('/messages/chat_id/msg_req_id');

            msg.type = 123;
            expect({ uid: 'user1' }).cannot.write(msg).path('/messages/chat_id/msg_req_id');

            msg.type = 'abc';
            expect({ uid: 'user1' }).cannot.write(msg).path('/messages/chat_id/msg_req_id');

            msg.type = { test: 'data' };
            expect({ uid: 'user1' }).cannot.write(msg).path('/messages/chat_id/msg_req_id');
        });
    });
});