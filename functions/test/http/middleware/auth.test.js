const chai = require('chai');
const { expect } = chai;

// add sinon plugin to chai
const sinonChai = require('sinon-chai');
chai.use(sinonChai);

// get sinon and create sandbox
const sinon = require('sinon');
const sandbox = sinon.sandbox.create();

const admin = require('firebase-admin');
const auth = require.main.require('functions/http/middleware/auth');


describe('httpMiddlewareAuth', () => {
    let verifyStub;
    let response;
    let statusStub;
    let sendStub;
    let nextStub;

    // set up stubs
    beforeEach(() => {
        // stub admin.initializeApp
        sandbox.stub(admin, 'initializeApp');

        // stub admin.auth().verify() call
        verifyStub = sandbox.stub();
        const authStub = sandbox.stub(admin, 'auth');
        authStub.get(() => (() => ({ verifyIdToken: verifyStub })));

        // stub response
        sendStub = sandbox.stub();
        statusStub = sandbox.stub();
        response = {
            status: statusStub.returns({
                send: sendStub
            })
        };

        // next function
        nextStub = sandbox.stub();
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('Should auth user using token in headers', () => {
        // create request object
        const request = {
            headers: {
                authorization: 'Bearer token'
            }
        };

        // set return value for verify
        const user = {
            uid: 'user-uid'
        };
        verifyStub.returns(Promise.resolve(user));

        return auth(request, response, nextStub)
            .then(() => {
                expect(verifyStub).to.be.calledWith('token');
                expect(request.user).to.be.equal(user);

                expect(nextStub).to.be.called;
                expect(statusStub).to.not.be.called;
                expect(sendStub).to.not.be.called;
            });
    });

    it('Should not auth user when token is missing', () => {
        // create request object
        const request = {
            headers: {}
        };

        auth(request, response, nextStub);

        expect(nextStub).to.not.be.called;
        expect(statusStub).to.be.calledWith(401);
    });

    it('Should not auth user when token has wrong format', () => {
        // create request object
        const request = {
            headers: {
                authorization: 'token'
            }
        };

        auth(request, response, nextStub);

        expect(nextStub).to.not.be.called;
        expect(statusStub).to.be.calledWith(401);
    });

    it('Should not auth user if firebase rejects the token', () => {
        // create request object
        const request = {
            headers: {
                authorization: 'Bearer token'
            }
        };

        // set return value for verify
        verifyStub.returns(Promise.reject());

        return auth(request, response, nextStub)
            .then(() => {
                expect(verifyStub).to.be.calledWith('token');

                expect(nextStub).to.not.be.called;
                expect(statusStub).to.be.calledWith(401);
            });
    });
});