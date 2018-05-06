const chai = require('chai');
const { expect } = chai;

// add sinon plugin to chai
const sinonChai = require('sinon-chai');
chai.use(sinonChai);

// get sinon and create sandbox
const sinon = require('sinon');
const sandbox = sinon.sandbox.create();

// initialize firebase sdk
const test = require('firebase-functions-test')();

const admin = require('firebase-admin');
const myFunctions = require('../../index');


describe('storageOnDelete function', () => {
    let onceStub;
    let setStub;

    // set up stubs
    beforeEach(() => {
        // stub admin.initializeApp
        sandbox.stub(admin, 'initializeApp');

        // stub admin.database().ref().once() and
        // admin.database().ref().set() call
        onceStub = sandbox.stub();
        setStub = sandbox.stub().returns(Promise.resolve());
        const refStub = sandbox.stub().returns({
            once: onceStub,
            set: setStub
        });
        const databaseStub = sandbox.stub(admin, 'database');
        databaseStub.get(() => (() => ({ ref: refStub })));
    });

    afterEach(() => {
        sandbox.restore();
        test.cleanup();
    });

    it('Should remove deleted file link from users profile photos array', () => {
        // set return value for once call to users profile photos
        const photos = ['link1', 'link2', 'gs://some-bucket/user_photos/user1/some-filename.jpg', 'link3'];
        onceStub.returns(Promise.resolve({
            val: () => { return photos; }
        }));

        // create fake event
        const fakeEvent = {
            data: {
                bucket: 'some-bucket',
                name: 'user_photos/user1/some-filename.jpg'
            }
        };

        return myFunctions.storageOnDelete(fakeEvent)
            .then(() => {
                // check the saved user photos array
                const expectedSetArg = [
                    'link1', 'link2', 'link3'
                ];
                expect(setStub).to.be.calledWith(expectedSetArg);
            });
    });

    it('Should not trigger for other paths', () => {
        // create fake event
        const fakeEvent = {
            data: {
                bucket: 'some-bucket',
                name: 'temp/user1/filename.jpg'
            }
        };

        expect(myFunctions.storageOnDelete(fakeEvent)).to.be.eventually.true;

        fakeEvent.data.filename = 'user_photos/filename.jpg';
        expect(myFunctions.storageOnDelete(fakeEvent)).to.be.eventually.true;
    });

    it('Should not trigger for directories', () => {
        // create fake event
        const fakeEvent = {
            data: {
                bucket: 'some-bucket',
                name: 'user_photos/user1/'
            }
        };

        expect(myFunctions.storageOnDelete(fakeEvent)).to.be.eventually.true;
    });
});