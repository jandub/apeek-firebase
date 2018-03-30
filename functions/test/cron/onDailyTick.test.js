const chai = require('chai');
const expect = chai.expect;

// add sinon plugin to chai
const sinonChai = require('sinon-chai');
chai.use(sinonChai);

// get sinon and create sandbox
const sinon = require('sinon');
const sandbox = sinon.sandbox.create();


describe('cronOnDailyTick function', () => {
    let admin, functions, myFunctions;

    // setup - stub admin.initializeApp and functions config
    beforeEach(() => {
        admin = require('firebase-admin');
        sandbox.stub(admin, 'initializeApp');

        functions = require('firebase-functions');
        sandbox.stub(functions, 'config').returns({
            firebase: {
                databaseURL: 'https://not-a-project.firebaseio.com',
                storageBucket: 'not-a-project.appspot.com',
            }
        });

        myFunctions = require('../../index');
    });

    afterEach(() =>  {
        sandbox.restore();
    });

    it('Should delete chats and messages nodes', () => {
        // stub admin.database().ref().update() call
        const updateStub = sandbox.stub().returns(Promise.resolve());
        const refStub = sandbox.stub().returns({update: updateStub});
        const databaseStub = sandbox.stub(admin, 'database');
        databaseStub.get(() => (() => ({ref: refStub})));
        
        // create fake pub/sub message event and call the function
        const fakeEvent = {
            data: new functions.pubsub.Message({data: null}),
        };

        return myFunctions.cronOnDailyTick(fakeEvent)
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