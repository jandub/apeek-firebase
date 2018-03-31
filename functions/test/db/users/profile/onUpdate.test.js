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


describe('dbUserProfileOnUpdate function', () => {
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
        myFunctions = require('../../../../index');

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

    it('Should update users new name in chats', () => {
        // set return value for database once call
        const onceResult = {
            val: () => { return {
                    'chat-uid-1': {recipientId: 'recipient-id-1'},
                    'chat-uid-2': {recipientId: 'recipient-id-2'},
                };
            }
        };
        onceStub.returns(Promise.resolve(onceResult));
        
        // create fake database update event
        const oldData = {
            uid: 'user-id',
            firstName: 'Firstname',
            lastName: 'Lastname',
            gender: 'male',
            interests: 'Some interests 1...',
            about: 'Some about 1...',
            photos: ['some-photo-link']
        };
        const newData = {
            uid: 'user-id',
            firstName: 'NewFirstname',
            lastName: 'Lastname',
            gender: 'male',
            interests: 'Some interests 1...',
            about: 'Some about 1...',
            photos: ['some-photo-link']
        };
        const fakeEvent = {
            data: new functions.database.DeltaSnapshot(null, null, oldData, newData),
        };

        return myFunctions.dbUsersProfileOnUpdate(fakeEvent)
            .then(() => {
                // check the update object
                const expectedUpdateArgs = {
                    '/chats/recipient-id-1/chat-uid-1/recipientName': 'NewFirstname',
                    '/chats/recipient-id-2/chat-uid-2/recipientName': 'NewFirstname'
                };
                expect(updateStub).to.be.calledWith(expectedUpdateArgs);
            });
    });

    it('Should update users new photo in chats', () => {
        // set return value for database once call
        const onceResult = {
            val: () => { return {
                    'chat-uid-1': {recipientId: 'recipient-id-1'},
                    'chat-uid-2': {recipientId: 'recipient-id-2'},
                };
            }
        };
        onceStub.returns(Promise.resolve(onceResult));
        
        // create fake database update event
        const oldData = {
            uid: 'user-id',
            firstName: 'Firstname',
            lastName: 'Lastname',
            gender: 'male',
            interests: 'Some interests 1...',
            about: 'Some about 1...',
            photos: ['some-photo-link']
        };
        const newData = {
            uid: 'user-id',
            firstName: 'Firstname',
            lastName: 'Lastname',
            gender: 'male',
            interests: 'Some interests 1...',
            about: 'Some about 1...',
            photos: ['new-photo-link']
        };
        const fakeEvent = {
            data: new functions.database.DeltaSnapshot(null, null, oldData, newData),
        };

        return myFunctions.dbUsersProfileOnUpdate(fakeEvent)
            .then(() => {
                // check the update object
                const expectedUpdateArgs = {
                    '/chats/recipient-id-1/chat-uid-1/recipientUserPhoto': 'new-photo-link',
                    '/chats/recipient-id-2/chat-uid-2/recipientUserPhoto': 'new-photo-link'
                };
                expect(updateStub).to.be.calledWith(expectedUpdateArgs);
            });
    });

    it('Should update users new name and photo in chats', () => {
        // set return value for database once call
        const onceResult = {
            val: () => { return {
                    'chat-uid-1': {recipientId: 'recipient-id-1'},
                    'chat-uid-2': {recipientId: 'recipient-id-2'},
                };
            }
        };
        onceStub.returns(Promise.resolve(onceResult));
        
        // create fake database update event
        const oldData = {
            uid: 'user-id',
            firstName: 'Firstname',
            lastName: 'Lastname',
            gender: 'male',
            interests: 'Some interests 1...',
            about: 'Some about 1...',
            photos: ['some-photo-link']
        };
        const newData = {
            uid: 'user-id',
            firstName: 'NewFirstname',
            lastName: 'Lastname',
            gender: 'male',
            interests: 'Some interests 1...',
            about: 'Some about 1...',
            photos: ['new-photo-link']
        };
        const fakeEvent = {
            data: new functions.database.DeltaSnapshot(null, null, oldData, newData),
        };

        return myFunctions.dbUsersProfileOnUpdate(fakeEvent)
            .then(() => {
                // check the update object
                const expectedUpdateArgs = {
                    '/chats/recipient-id-1/chat-uid-1/recipientName': 'NewFirstname',
                    '/chats/recipient-id-1/chat-uid-1/recipientUserPhoto': 'new-photo-link',
                    '/chats/recipient-id-2/chat-uid-2/recipientName': 'NewFirstname',
                    '/chats/recipient-id-2/chat-uid-2/recipientUserPhoto': 'new-photo-link'
                };
                expect(updateStub).to.be.calledWith(expectedUpdateArgs);
            });
    });

    it('Should not update chats if name and photo are unchanged', () => {
        // set return value for database once call
        const onceResult = {
            val: () => { return {
                    'chat-uid-1': {recipientId: 'recipient-id-1'},
                    'chat-uid-2': {recipientId: 'recipient-id-2'},
                };
            }
        };
        onceStub.returns(Promise.resolve(onceResult));
        
        // create fake database update event
        const oldData = {
            uid: 'user-id',
            firstName: 'Firstname',
            lastName: 'Lastname',
            gender: 'male',
            interests: 'Some interests 1...',
            about: 'Some about 1...',
            photos: ['some-photo-link']
        };
        const newData = {
            uid: 'user-id',
            firstName: 'Firstname',
            lastName: 'NewLastname',
            gender: 'female',
            interests: 'Some new interests 1...',
            about: 'Some new about 1...',
            photos: ['some-photo-link']
        };
        const fakeEvent = {
            data: new functions.database.DeltaSnapshot(null, null, oldData, newData),
        };

        return expect(myFunctions.dbUsersProfileOnUpdate(fakeEvent)).to.eventually.be.true;
    });

    it('Should not update chats if there are none', () => {
        // set return value for database once call
        const onceResult = {
            val: () => { return null}
        };
        onceStub.returns(Promise.resolve(onceResult));
        
        // create fake database update event
        const oldData = {
            uid: 'user-id',
            firstName: 'Firstname',
            lastName: 'Lastname',
            gender: 'male',
            interests: 'Some interests 1...',
            about: 'Some about 1...',
            photos: ['some-photo-link']
        };
        const newData = {
            uid: 'user-id',
            firstName: 'NewFirstname',
            lastName: 'Lastname',
            gender: 'male',
            interests: 'Some interests 1...',
            about: 'Some about 1...',
            photos: ['new-photo-link']
        };
        const fakeEvent = {
            data: new functions.database.DeltaSnapshot(null, null, oldData, newData),
        };

        return expect(myFunctions.dbUsersProfileOnUpdate(fakeEvent)).to.eventually.be.true;
    });
});