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


describe('cronOnDailyTick function', () => {
    // set up stubs
    beforeEach(() => {
        sandbox.stub(admin, 'initializeApp');
    });

    afterEach(() => {
        sandbox.restore();
        test.cleanup();
    });

    it('Should delete chats and messages nodes', () => {
        // stub admin.database().ref().update() call
        const updateStub = sandbox.stub().returns(Promise.resolve());
        const refStub = sandbox.stub().returns({ update: updateStub });
        const databaseStub = sandbox.stub(admin, 'database');
        databaseStub.get(() => (() => ({ ref: refStub })));

        // create fake pub/sub message event and call the function
        const fakeMsg = test.pubsub.exampleMessage();

        return myFunctions.cronOnDailyTick(fakeMsg)
            .then(() => {
                // check if update function was called with correct args
                const expectedParams = {
                    '/chats': null,
                    '/messages': null
                };
                expect(updateStub).to.be.calledWith(expectedParams);
            });
    });
});