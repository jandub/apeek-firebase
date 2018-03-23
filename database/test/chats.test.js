const chai = require('chai');
const expect = chai.expect;

// add targaryen plugin to chai
const targaryen = require('targaryen/plugins/chai');
chai.use(targaryen);

// add firebase rules
const rules = targaryen.json.loadSync('database/database.rules.json');
targaryen.setFirebaseRules(rules);

// load testing data
const usersNode = require('./data/users');
const chatsMsgsPendingNodes = require('./data/chats-msgs-pending');


describe('Chats - rules', () => {
    before(() => {
        const data = Object.assign({}, usersNode, chatsMsgsPendingNodes);
        targaryen.setFirebaseData(data);
    });

    describe('Read', () => {
        it('Should not allow anonymous user to read the chat', () => {
            expect(null).cannot.read.path('/chats/user1/chat_id');
        });

        it('Should allow authenticated user to read her chat', () => {
            expect({uid: 'user1'}).can.read.path('/chats/user1/chat_id');
        });

        it('Should not allow authenticated user to read others chats', () => {
            expect({uid: 'user2'}).cannot.read.path('/chats/user1/chat_id');
        });
    });

    describe('Write', () => {
        it('Should not allow anonymous user to write', () => {
            expect(null).cannot.write({test: 'data'}).path('/chats/user1/chat_id');
        });

        it('Should not allow authenticated user to write to her chat', () => {
            expect({uid: 'user1'}).cannot.write({test: 'data'}).path('/chats/user1/chat_id');
        });

        it('Should not allow authenticated user to write to others chats', () => {
            expect({uid: 'user2'}).cannot.write({test: 'data'}).path('/chats/user1/chat_id');
        });
    });
});