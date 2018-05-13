const chai = require('chai');
const { expect } = chai;

// add sinon plugin to chai
const sinonChai = require('sinon-chai');
chai.use(sinonChai);

// add chai-as-promised to chai
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);

// get sinon and create sandbox
const sinon = require('sinon');
const sandbox = sinon.sandbox.create();

// initialize firebase sdk
const test = require('firebase-functions-test')();

const admin = require('firebase-admin');
const myFunctions = require('../../../../index');


describe('dbUserProfileOnUpdate function', () => {
    let onceStub;
    let updateStub;

    // set up stubs
    beforeEach(() => {
        // stub admin.initializeApp
        sandbox.stub(admin, 'initializeApp');

        // stub admin.database().ref().once() call and
        // admin.database().ref().update() call
        onceStub = sandbox.stub();
        updateStub = sandbox.stub().returns(Promise.resolve());
        const refStub = sandbox.stub().returns({
            update: updateStub,
            once: onceStub
        });
        const databaseStub = sandbox.stub(admin, 'database');
        databaseStub.get(() => (() => ({ ref: refStub })));
    });

    afterEach(() => {
        sandbox.restore();
        test.cleanup();
    });

    it('Should update users new name in chats', () => {
        // set return value for database once call
        const onceResult = {
            val() {
                return {
                    'chat-uid-1': { recipientId: 'recipient-id-1' },
                    'chat-uid-2': { recipientId: 'recipient-id-2' }
                };
            }
        };
        onceStub.returns(Promise.resolve(onceResult));

        // create fake database update event
        const beforeData = {
            uid: 'user-id',
            firstName: 'Firstname',
            lastName: 'Lastname',
            gender: 'male',
            interests: 'Some interests 1...',
            about: 'Some about 1...'
        };
        const afterData = {
            uid: 'user-id',
            firstName: 'NewFirstname',
            lastName: 'Lastname',
            gender: 'male',
            interests: 'Some interests 1...',
            about: 'Some about 1...'
        };
        const beforeSnap = test.database.makeDataSnapshot(beforeData);
        const afterSnap = test.database.makeDataSnapshot(afterData);

        const change = test.makeChange(beforeSnap, afterSnap);
        const context = {
            params: {
                userId: 'user-id'
            }
        };

        const wrapped = test.wrap(myFunctions.dbUsersProfileOnUpdate);

        return wrapped(change, context)
            .then(() => {
                // check the update object
                const expectedUpdateArgs = {
                    '/chats/recipient-id-1/chat-uid-1/recipientName': 'NewFirstname',
                    '/chats/recipient-id-2/chat-uid-2/recipientName': 'NewFirstname'
                };
                expect(updateStub).to.be.calledWith(expectedUpdateArgs);
            });
    });

    it('Should not update chats if name is unchanged', () => {
        // set return value for database once call
        const onceResult = {
            val() {
                return {
                    'chat-uid-1': { recipientId: 'recipient-id-1' },
                    'chat-uid-2': { recipientId: 'recipient-id-2' }
                };
            }
        };
        onceStub.returns(Promise.resolve(onceResult));

        // create fake database update event
        const beforeData = {
            uid: 'user-id',
            firstName: 'Firstname',
            lastName: 'Lastname',
            gender: 'male',
            interests: 'Some interests 1...',
            about: 'Some about 1...'
        };
        const afterData = {
            uid: 'user-id',
            firstName: 'Firstname',
            lastName: 'NewLastname',
            gender: 'female',
            interests: 'Some new interests 1...',
            about: 'Some new about 1...'
        };
        const beforeSnap = test.database.makeDataSnapshot(beforeData);
        const afterSnap = test.database.makeDataSnapshot(afterData);

        const change = test.makeChange(beforeSnap, afterSnap);
        const context = {
            params: {
                userId: 'user-id'
            }
        };

        const wrapped = test.wrap(myFunctions.dbUsersProfileOnUpdate);

        return expect(wrapped(change, context)).to.be.true;
    });

    it('Should not update chats if there are none', () => {
        // set return value for database once call
        const onceResult = {
            val() {
                return null;
            }
        };
        onceStub.returns(Promise.resolve(onceResult));

        // create fake database update event
        const beforeData = {
            uid: 'user-id',
            firstName: 'Firstname',
            lastName: 'Lastname',
            gender: 'male',
            interests: 'Some interests 1...',
            about: 'Some about 1...'
        };
        const afterData = {
            uid: 'user-id',
            firstName: 'NewFirstname',
            lastName: 'Lastname',
            gender: 'male',
            interests: 'Some interests 1...',
            about: 'Some about 1...'
        };
        const beforeSnap = test.database.makeDataSnapshot(beforeData);
        const afterSnap = test.database.makeDataSnapshot(afterData);

        const change = test.makeChange(beforeSnap, afterSnap);
        const context = {
            params: {
                userId: 'user-id'
            }
        };

        const wrapped = test.wrap(myFunctions.dbUsersProfileOnUpdate);

        return expect(wrapped(change, context)).to.eventually.be.true;
    });
});