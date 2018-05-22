const chai = require('chai');
const { expect } = chai;

// add sinon plugin to chai
const sinonChai = require('sinon-chai');
chai.use(sinonChai);

// get sinon and create sandbox
const sinon = require('sinon');
const sandbox = sinon.sandbox.create();

const admin = require('firebase-admin');
const reorder = require.main.require('functions/http/users/photos/reorder');


describe('httpUsersPhotosReorder function', () => {
    let setStub;
    let onceStub;
    let response;
    let statusStub;
    let sendStub;

    // set up stubs
    beforeEach(() => {
        // stub admin.initializeApp
        sandbox.stub(admin, 'initializeApp');

        // stub admin.database().ref().set() and once() call
        setStub = sandbox.stub().returns(Promise.resolve());
        onceStub = sandbox.stub();
        const refStub = sandbox.stub().returns({
            set: setStub,
            once: onceStub
        });
        const databaseStub = sandbox.stub(admin, 'database');
        databaseStub.get(() => (() => ({ ref: refStub })));

        // stub response
        sendStub = sandbox.stub();
        statusStub = sandbox.stub();
        response = {
            status: statusStub.returns({
                send: sendStub
            })
        };
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('Should save reordered user photos', () => {
        // create request object
        const request = {
            body: {
                order: [3, 2, 1]
            },
            user: {
                uid: 'user-uid'
            }
        };

        // set return value for once call
        const onceResult = {
            val() {
                return ['photo1', 'photo2', 'photo3'];
            }
        };
        onceStub.returns(Promise.resolve(onceResult));

        return reorder(request, response)
            .then(() => {
                expect(setStub).to.be.calledWith(['photo3', 'photo2', 'photo1']);

                expect(statusStub).to.be.calledWith(200);
                expect(sendStub).to.be.calledWith(true);
            });
    });

    it('Should not accept request with missing "order" param', () => {
        // create request object
        const request = {
            body: {},
            user: {
                uid: 'user-uid'
            }
        };

        reorder(request, response);

        expect(setStub).to.not.be.called;
        expect(statusStub).to.be.calledWith(403);
    });

    it('Should not accept request where "order" param is not array', () => {
        // create request object
        const request = {
            body: {
                order: 'test'
            },
            user: {
                uid: 'user-uid'
            }
        };

        reorder(request, response);

        expect(setStub).to.not.be.called;
        expect(statusStub).to.be.calledWith(403);
    });

    it('Should not accept request where "order" array has more then 6 items', () => {
        // create request object
        const request = {
            body: {
                order: [1, 2, 3, 4, 5, 6, 7]
            },
            user: {
                uid: 'user-uid'
            }
        };

        reorder(request, response);

        expect(setStub).to.not.be.called;
        expect(statusStub).to.be.calledWith(403);
    });

    it('Should not accept request where "order" array is not unique', () => {
        // create request object
        const request = {
            body: {
                order: [1, 2, 2]
            },
            user: {
                uid: 'user-uid'
            }
        };

        reorder(request, response);

        expect(setStub).to.not.be.called;
        expect(statusStub).to.be.calledWith(403);
    });

    it('Should not accept request where "order" array is not sequential', () => {
        // create request object
        const request = {
            body: {
                order: [1, 2, 4]
            },
            user: {
                uid: 'user-uid'
            }
        };

        reorder(request, response);

        expect(setStub).to.not.be.called;
        expect(statusStub).to.be.calledWith(403);
    });

    it('Should not save anything if user has no photos', () => {
        // create request object
        const request = {
            body: {
                order: []
            },
            user: {
                uid: 'user-uid'
            }
        };

        // set return value for once call
        const onceResult = {
            val() {
                return null;
            }
        };
        onceStub.returns(Promise.resolve(onceResult));

        return reorder(request, response)
            .then(() => {
                expect(setStub).to.not.called;

                expect(statusStub).to.be.calledWith(200);
                expect(sendStub).to.be.calledWith(true);
            });
    });

    it('Should not accept request where no. of order items does not equal to no. of photos', () => {
        // create request object
        const request = {
            body: {
                order: [1, 2, 3]
            },
            user: {
                uid: 'user-uid'
            }
        };

        // set return value for once call
        const onceResult = {
            val() {
                return ['photo1', 'photo2'];
            }
        };
        onceStub.returns(Promise.resolve(onceResult));

        return reorder(request, response)
            .then(() => {
                expect(setStub).to.not.called;

                expect(statusStub).to.be.calledWith(403);
            });
    });
});