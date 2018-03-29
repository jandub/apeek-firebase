const chai = require('chai');
const assert = chai.assert;

// add promise plugin to chai
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);

// get sinon and sinon-test
// sinon-test automatically cleans up all the mocks and stubs after test
const sinon = require('sinon');
const sinonTest = require('sinon-test')(sinon, {useFakeTimers: false});


describe('cronOnDailyTick function', () => {
    let admin, functions, myFunctions;

    // setup - stub admin.initializeApp and functions config
    // stubs will get automatically cleaned up by sinon-test
    before(() => {
        admin = require('firebase-admin');
        sinon.stub(admin, 'initializeApp');

        functions = require('firebase-functions');
        sinon.stub(functions, 'config').returns({
            firebase: {
                databaseURL: 'https://not-a-project.firebaseio.com',
                storageBucket: 'not-a-project.appspot.com',
            }
        });

        myFunctions = require('../../index');
    });

    it('Should delete chats and messages nodes', sinonTest(() => {
        // stub admin.database().ref().update() call
        const updateStub = sinon.stub().returns(Promise.resolve());
        const refStub = sinon.stub().returns({update: updateStub});
        const databaseStub = sinon.stub(admin, 'database');
        databaseStub.get(() => (() => ({ref: refStub})));
        
        // create fake pub/sub message event and call the function
        const fakeEvent = {
            data: new functions.pubsub.Message({data: null}),
        };
        assert.eventually.equal(myFunctions.cronOnDailyTick(fakeEvent), null);

        // check if update function was called with correct args
        const expectedParams = {
            '/chats': null,
            '/messages': null
        };
        sinon.assert.calledWith(updateStub, expectedParams);
    }));
});