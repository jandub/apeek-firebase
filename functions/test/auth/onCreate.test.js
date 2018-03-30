const chai = require('chai');
const expect = chai.expect;

// add sinon plugin to chai
const sinonChai = require('sinon-chai');
chai.use(sinonChai);

// get sinon and create sandbox
const sinon = require('sinon');
const sandbox = sinon.sandbox.create();


describe('authOnCreate function', () => {
    let admin, functions, myFunctions, axiosGetStub, uploadStub, setStub;

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
        myFunctions = require('../../index');

        // stub axios.get call
        const axios = require('axios');
        axiosGetStub = sandbox.stub(axios, 'get');

        // stub uuid v4 creation
        const uuid = require('uuid');
        sandbox.stub(uuid, 'v4').returns('some-uuid');

        // stub admin.storage().bucket().upload() call
        uploadStub = sandbox.stub();
        const bucketStub = sandbox.stub().returns({upload: uploadStub});
        const storageStub = sandbox.stub(admin, 'storage');
        storageStub.get(() => (() => ({bucket: bucketStub})));

        // stub admin.database().ref().set() call
        setStub = sandbox.stub();
        const refStub = sandbox.stub().returns({set: setStub});
        const databaseStub = sandbox.stub(admin, 'database');
        databaseStub.get(() => (() => ({ref: refStub})));
    });

    afterEach(() =>  {
        sandbox.restore();
    });

    it('Should create a user profile and upload a photo from Facebook', () => {
        // set response for axios.get call to facebook api
        const fbResponse = {
            data: {
                data: {
                    height: 1052,
                    is_silhouette: false,
                    url: 'test_url',
                    width: 1052
                }
            }
        };
        axiosGetStub.returns(Promise.resolve(fbResponse));
        
        // set return value for bucket upload call
        const uploadResult = [{
            metadata: {
                name: 'some-file-path',
                bucket: 'some-bucket'
            }
        }];
        uploadStub.returns(Promise.resolve(uploadResult));

        // set return value for database set call
        setStub.returns(Promise.resolve());
        
        // create fake auth event
        const fakeEvent = {
            data: {
                uid: 'test-uid',
                displayName: 'Firstname Lastname',
                email: 'test@email.com',
                gender: 'male',
                providerData: [{
                    providerId: 'facebook.com',
                    uid: 'fb-test-uid'
                }]
            },
        };

        return myFunctions.authOnCreate(fakeEvent)
            .then(() => {
                // check if the file got uploaded
                const expectedUploadArgs = [
                    'test_url',
                    {destination: `user_photos/test-uid/some-uuid.jpg`}
                ];
                expect(uploadStub).to.be.calledWith(...expectedUploadArgs);

                // check the saved user object
                const expectedUpdateArgs = {
                    profile: {
                        firstName: 'Firstname',
                        lastName: 'Lastname',
                        gender: 'male',
                        about: '',
                        interests: '',
                        photos: ['gs://some-bucket/some-file-path']
                    },
                    meta: {
                        email: 'test@email.com',
                    },
                };
                expect(setStub).to.be.calledWith(expectedUpdateArgs);
            });
    });

    it('Should create a user profile when the call to Facebook api fails', () => {
        // axios.get call fails
        axiosGetStub.returns(Promise.reject());

        // set return value for database set call
        setStub.returns(Promise.resolve());
        
        // create fake auth event
        const fakeEvent = {
            data: {
                uid: 'test-uid',
                displayName: 'Firstname Lastname',
                email: 'test@email.com',
                gender: 'male',
                providerData: [{
                    providerId: 'facebook.com',
                    uid: 'fb-test-uid'
                }]
            },
        };

        return myFunctions.authOnCreate(fakeEvent)
            .then(() => {
                // check the saved user object
                const expectedUpdateArgs = {
                    profile: {
                        firstName: 'Firstname',
                        lastName: 'Lastname',
                        gender: 'male',
                        about: '',
                        interests: '',
                        photos: [null]
                    },
                    meta: {
                        email: 'test@email.com',
                    },
                };
                expect(setStub).to.be.calledWith(expectedUpdateArgs);
            });
    });

    it('Should create a user profile when the upload to cloud storage fails', () => {
        // set response for axios.get call to facebook api
        const fbResponse = {
            data: {
                data: {
                    height: 1052,
                    is_silhouette: false,
                    url: 'test_url',
                    width: 1052
                }
            }
        };
        axiosGetStub.returns(Promise.resolve(fbResponse));
        
        // bucket upload fails
        uploadStub.returns(Promise.reject());

        // set return value for database set call
        setStub.returns(Promise.resolve());
        
        // create fake auth event
        const fakeEvent = {
            data: {
                uid: 'test-uid',
                displayName: 'Firstname Lastname',
                email: 'test@email.com',
                gender: 'male',
                providerData: [{
                    providerId: 'facebook.com',
                    uid: 'fb-test-uid'
                }]
            },
        };

        return myFunctions.authOnCreate(fakeEvent)
            .then(() => {
                // check the saved user object
                const expectedUpdateArgs = {
                    profile: {
                        firstName: 'Firstname',
                        lastName: 'Lastname',
                        gender: 'male',
                        about: '',
                        interests: '',
                        photos: [null]
                    },
                    meta: {
                        email: 'test@email.com',
                    },
                };
                expect(setStub).to.be.calledWith(expectedUpdateArgs);
            });
    });
});