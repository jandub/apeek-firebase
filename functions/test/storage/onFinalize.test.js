const chai = require('chai');
const expect = chai.expect;

// add sinon plugin to chai
const sinonChai = require('sinon-chai');
chai.use(sinonChai);

// get sinon and create sandbox
const sinon = require('sinon');
const sandbox = sinon.sandbox.create();

// initialize firebase sdk
const test = require('firebase-functions-test')();


describe('storageOnFinalize function', () => {
    let admin, myFunctions, onceStub, setStub, fileStub, deleteStub;

    // set up stubs
    beforeEach(() => {
        // stub admin.initializeApp
        admin = require('firebase-admin');
        sandbox.stub(admin, 'initializeApp');

        // get cloud functions
        myFunctions = require('../../index');

        // stub admin.storage().bucket().file().delete() call
        deleteStub = sandbox.stub();
        fileStub = sandbox.stub().returns({delete: deleteStub});
        const bucketStub = sandbox.stub().returns({file: fileStub});
        const storageStub = sandbox.stub(admin, 'storage');
        storageStub.get(() => (() => ({bucket: bucketStub})));

        // stub admin.database().ref().once() and
        // admin.database().ref().set() call
        onceStub = sandbox.stub();
        setStub = sandbox.stub().returns(Promise.resolve());
        const refStub = sandbox.stub().returns({
            once: onceStub,
            set: setStub
        });
        const databaseStub = sandbox.stub(admin, 'database');
        databaseStub.get(() => (() => ({ref: refStub})));
    });

    afterEach(() =>  {
        sandbox.restore();
        test.cleanup();
    });

    it('Should add uploaded file link to users profile photos array', () => {
        // set return value for once call to users profile photos
        const photos = ['link1', 'link2', 'link3'];
        onceStub.returns(Promise.resolve({
            val: () => { return photos; }
        }));
        
        // create fake event
        const fakeEvent = {
            data: {
                bucket: 'some-bucket',
                name: 'user_photos/user1/some-filename.jpg'
            },
        };

        return myFunctions.storageOnFinalize(fakeEvent)
            .then(() => {
                // check if delete was not called
                expect(deleteStub).not.to.be.called;

                // check the saved user photos array
                const expectedSetArg = [
                    'link1', 'link2', 'link3', 'gs://some-bucket/user_photos/user1/some-filename.jpg'
                ];
                expect(setStub).to.be.calledWith(expectedSetArg);
            });
    });

    it('Should add uploaded file link to users profile photos array on correct position', () => {
        // set return value for once call to users profile photos
        const photos = ['link1', 'link2', 'link3'];
        onceStub.returns(Promise.resolve({
            val: () => { return photos; }
        }));
        
        // create fake event
        const fakeEvent = {
            data: {
                bucket: 'some-bucket',
                metadata: {
                    position: '2'
                },
                name: 'user_photos/user1/some-filename.jpg'
            },
        };

        return myFunctions.storageOnFinalize(fakeEvent)
            .then(() => {
                // check if delete was not called
                expect(deleteStub).not.to.be.called;

                // check the saved user photos array
                const expectedSetArg = [
                    'link1', 'gs://some-bucket/user_photos/user1/some-filename.jpg', 'link2', 'link3'
                ];
                expect(setStub).to.be.calledWith(expectedSetArg);
            });
    });

    it('Should add uploaded file link to users profile photos array if the position is invalid', () => {
        // set return value for once call to users profile photos
        const photos = ['link1', 'link2', 'link3'];
        onceStub.returns(Promise.resolve({
            val: () => { return photos; }
        }));
        
        // create fake event
        const fakeEvent = {
            data: {
                bucket: 'some-bucket',
                metadata: {
                    position: '8'
                },
                name: 'user_photos/user1/some-filename.jpg'
            },
        };

        return myFunctions.storageOnFinalize(fakeEvent)
            .then(() => {
                // check if delete was not called
                expect(deleteStub).not.to.be.called;

                // check the saved user photos array
                const expectedSetArg = [
                    'link1', 'link2', 'link3', 'gs://some-bucket/user_photos/user1/some-filename.jpg'
                ];
                expect(setStub).to.be.calledWith(expectedSetArg);
            });
    });

    it('Should add uploaded file link to empty users profile photos array', () => {
        // set return value for once call to users profile photos
        const photos = null;
        onceStub.returns(Promise.resolve({
            val: () => { return photos; }
        }));
        
        // create fake event
        const fakeEvent = {
            data: {
                bucket: 'some-bucket',
                name: 'user_photos/user1/some-filename.jpg'
            },
        };

        return myFunctions.storageOnFinalize(fakeEvent)
            .then(() => {
                // check if delete was not called
                expect(deleteStub).not.to.be.called;

                // check the saved user photos array
                const expectedSetArg = [
                    'gs://some-bucket/user_photos/user1/some-filename.jpg'
                ];
                expect(setStub).to.be.calledWith(expectedSetArg);
            });
    });

    it('Should delete the file if user has already 6 photos', () => {
        // set return value for once call to users profile photos
        const photos = ['link1', 'link2', 'link3', 'link4', 'link5', 'link6'];
        onceStub.returns(Promise.resolve({
            val: () => { return photos; }
        }));
        
        // create fake event
        const fakeEvent = {
            data: {
                bucket: 'some-bucket',
                name: 'user_photos/user1/some-filename.jpg'
            },
        };

        return myFunctions.storageOnFinalize(fakeEvent)
            .then(() => {
                // should not update users photos
                expect(setStub).not.to.be.called;

                // check if the file got deleted
                const expectedArg = 'user_photos/user1/some-filename.jpg';
                expect(deleteStub).to.be.called;
                expect(fileStub).to.be.calledWith(expectedArg);
            });
    });

    it('Should not trigger for other paths', () => {
        // create fake event
        const fakeEvent = {
            data: {
                bucket: 'some-bucket',
                name: 'temp/user1/filename.jpg'
            },
        };

        expect(myFunctions.storageOnFinalize(fakeEvent)).to.be.eventually.true;

        fakeEvent.data.filename = 'user_photos/filename.jpg';
        expect(myFunctions.storageOnFinalize(fakeEvent)).to.be.eventually.true;
    });

    it('Should not trigger for directories', () => {
        // create fake event
        const fakeEvent = {
            data: {
                bucket: 'some-bucket',
                name: 'user_photos/user1/'
            },
        };

        expect(myFunctions.storageOnFinalize(fakeEvent)).to.be.eventually.true;
    });
});