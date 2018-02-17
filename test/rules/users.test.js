const chai = require('chai');
const expect = chai.expect;
const targaryen = require('targaryen/plugins/chai');

chai.use(targaryen);

const {PATH_CONSTS, PATH_RULES, PATH_DATA} = require('./paths');
const rules = targaryen.json.loadSync(PATH_RULES);


describe('Users rules - read', () => {
    before(() => {
        const data = require.main.require(PATH_DATA + '/chat-empty.data.js');
        targaryen.setFirebaseData(data);
        targaryen.setFirebaseRules(rules);
    });

    it('Should not allow anonymous user to read profiles', () => {
        expect(null).cannot.read.path('/users/user1');
    });

    it('Should allow authenticated user to read her profile', () => {
        expect({uid: 'user1'}).can.read.path('/users/user1');
    });

    it('Should allow authenticated users to read others profiles', () => {
        expect({uid: 'user2'}).can.read.path('/users/user1');
    });
});

describe('Users rules - write', () => {
    before(() => {
        const data = require.main.require(PATH_DATA + '/chat-empty.data.js');
        targaryen.setFirebaseData(data);
        targaryen.setFirebaseRules(rules);
    });

    it('Should not allow anonymous user to write into profiles', () => {
        expect(null).cannot.write({test: 'data'}).path('/users/user1');
    });

    it('Should allow authenticated user to write into her profile', () => {
        expect({uid: 'user1'}).can.write({test: 'data'}).path('/users/user1');
    });

    it('Should not allow authenticated users to write into others profiles', () => {
        expect({uid: 'user2'}).cannot.write({test: 'data'}).path('/users/user1');
    });
});