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


describe('dbUserPhotosOnWrite function', () => {
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

    it('Should update users new photo in chats if update occurs', () => {
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
        const beforeData = ['photo1'];
        const afterData = ['photo2', 'photo1'];
        const beforeSnap = test.database.makeDataSnapshot(beforeData);
        const afterSnap = test.database.makeDataSnapshot(afterData);

        const change = test.makeChange(beforeSnap, afterSnap);
        const context = {
            params: {
                userId: 'user-id'
            }
        };

        const wrapped = test.wrap(myFunctions.dbUsersPhotosOnWrite);

        return wrapped(change, context)
            .then(() => {
                // check the update object
                const expectedUpdateArgs = {
                    '/chats/recipient-id-1/chat-uid-1/recipientUserPhoto': 'photo2',
                    '/chats/recipient-id-2/chat-uid-2/recipientUserPhoto': 'photo2'
                };
                expect(updateStub).to.be.calledWith(expectedUpdateArgs);
            });
    });

    it('Should update users new photo in chats if create occurs', () => {
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
        const beforeData = null;
        const afterData = ['photo1'];
        const beforeSnap = test.database.makeDataSnapshot(beforeData);
        const afterSnap = test.database.makeDataSnapshot(afterData);

        const change = test.makeChange(beforeSnap, afterSnap);
        const context = {
            params: {
                userId: 'user-id'
            }
        };

        const wrapped = test.wrap(myFunctions.dbUsersPhotosOnWrite);

        return wrapped(change, context)
            .then(() => {
                // check the update object
                const expectedUpdateArgs = {
                    '/chats/recipient-id-1/chat-uid-1/recipientUserPhoto': 'photo1',
                    '/chats/recipient-id-2/chat-uid-2/recipientUserPhoto': 'photo1'
                };
                expect(updateStub).to.be.calledWith(expectedUpdateArgs);
            });
    });

    it('Should update users new photo in chats if delete occurs', () => {
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
        const beforeData = ['photo1'];
        const afterData = null;
        const beforeSnap = test.database.makeDataSnapshot(beforeData);
        const afterSnap = test.database.makeDataSnapshot(afterData);

        const change = test.makeChange(beforeSnap, afterSnap);
        const context = {
            params: {
                userId: 'user-id'
            }
        };

        const wrapped = test.wrap(myFunctions.dbUsersPhotosOnWrite);

        return wrapped(change, context)
            .then(() => {
                // check the update object
                const expectedUpdateArgs = {
                    '/chats/recipient-id-1/chat-uid-1/recipientUserPhoto': null,
                    '/chats/recipient-id-2/chat-uid-2/recipientUserPhoto': null
                };
                expect(updateStub).to.be.calledWith(expectedUpdateArgs);
            });
    });

    it('Should not update chats if first photo is unchanged', () => {
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
        const beforeData = ['photo1'];
        const afterData = ['photo1', 'photo2'];
        const beforeSnap = test.database.makeDataSnapshot(beforeData);
        const afterSnap = test.database.makeDataSnapshot(afterData);

        const change = test.makeChange(beforeSnap, afterSnap);
        const context = {
            params: {
                userId: 'user-id'
            }
        };

        const wrapped = test.wrap(myFunctions.dbUsersPhotosOnWrite);

        expect(wrapped(change, context)).to.be.true;
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
        const beforeData = ['photo1'];
        const afterData = ['photo2', 'photo1'];
        const beforeSnap = test.database.makeDataSnapshot(beforeData);
        const afterSnap = test.database.makeDataSnapshot(afterData);

        const change = test.makeChange(beforeSnap, afterSnap);
        const context = {
            params: {
                userId: 'user-id'
            }
        };

        const wrapped = test.wrap(myFunctions.dbUsersPhotosOnWrite);

        return expect(wrapped(change, context)).to.be.eventually.true;
    });
});