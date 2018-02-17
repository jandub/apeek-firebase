const chai = require('chai');
const expect = chai.expect;
const targaryen = require('targaryen/plugins/chai');

chai.use(targaryen);

const {PATH_CONSTS, PATH_RULES, PATH_DATA} = require('./paths');
const rules = targaryen.json.loadSync(PATH_RULES);


describe('Chats rules - read', () => {
    before(() => {
        const data = require.main.require(PATH_DATA + '/chat-pending.data.js');
        targaryen.setFirebaseData(data);
        targaryen.setFirebaseRules(rules);
    });

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

describe('Chats rules - write', () => {
    before(() => {
        const data = require.main.require(PATH_DATA + '/chat-pending.data.js');
        targaryen.setFirebaseData(data);
        targaryen.setFirebaseRules(rules);
    });

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