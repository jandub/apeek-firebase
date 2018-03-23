const chai = require('chai');
const expect = chai.expect;

// add targaryen plugin to chai
const targaryen = require('targaryen/plugins/chai');
chai.use(targaryen);

// load constants
const {PATH_CONSTS} = require('./paths');
const consts = require.main.require(PATH_CONSTS);

// add firebase rules
const rules = targaryen.json.loadSync('database/database.rules.json');
targaryen.setFirebaseRules(rules);

// load testing data
const usersNode = require('./data/users');


// helper function that returns valid user profile
const getProfile = () => {
    return {
        uid: 'user1',
        firstName: 'Firstname1',
        lastName: 'Lastname1',
        gender: consts.GENDER_MALE,
        interests: 'Some interests 1...',
        about: 'Something about user1...',
        photos: ['photolink']
    };
}


describe('Users - rules', () => {
    before(() => {
        targaryen.setFirebaseData(usersNode);
    });

    describe('Profile', () => {
        describe('Read', () => {
            it('Should not allow anonymous user to read user profiles', () => {
                expect(null).cannot.read.path('/users/user1/profile');
            });

            it('Should allow authenticated user to read her profile', () => {
                expect({uid: 'user1'}).can.read.path('/users/user1/profile');
            });

            it('Should allow authenticated user to read other user profiles', () => {
                expect({uid: 'user2'}).can.read.path('/users/user1/profile');
            });
        });

        describe('Write', () => {
            it('Should not allow anonymous user to write into user profiles', () => {
                const profile = getProfile();
                expect(null).cannot.write(profile).path('/users/user1/profile');
            });

            it('Should allow authenticated user to write into her profile', () => {
                const profile = getProfile();
                expect({uid: 'user1'}).can.write(profile).path('/users/user1/profile');
            });

            it('Should not allow authenticated user to write into other user profiles', () => {
                const profile = getProfile();
                expect({uid: 'user2'}).cannot.write(profile).path('/users/user1/profile');
            });
        });
    });

    describe('Meta', () => {
        describe('Read', () => {
            it('Should not allow anonymous user to read users meta data', () => {
                expect(null).cannot.read.path('/users/user1/meta');
            });

            it('Should not allow authenticated user to read her meta data', () => {
                expect({uid: 'user1'}).cannot.read.path('/users/user1/meta');
            });

            it('Should not allow authenticated user to read other users meta data', () => {
                expect({uid: 'user2'}).cannot.read.path('/users/user1/meta');
            });
        });

        describe('Write', () => {
            it('Should not allow anonymous user to write into users meta data', () => {
                expect(null).cannot.write({test: 'data'}).path('/users/user1/meta');
            });

            it('Should not allow authenticated user to write into her meta data', () => {
                expect({uid: 'user1'}).cannot.write({test: 'data'}).path('/users/user1/meta');
            });

            it('Should not allow authenticated user to write into other users meta data', () => {
                expect({uid: 'user2'}).cannot.write({test: 'data'}).path('/users/user1/meta');
            });
        });
    });

    describe('Location', () => {
        describe('Read', () => {
            it('Should not allow anonymous user to read user locations', () => {
                expect(null).cannot.read.path('/users/user1/location');
            });

            it('Should allow authenticated user to read her location', () => {
                expect({uid: 'user1'}).can.read.path('/users/user1/location');
            });

            it('Should not allow authenticated user to read other user locations', () => {
                expect({uid: 'user2'}).cannot.read.path('/users/user1/location');
            });
        });

        describe('Write', () => {
            // TODO fix test data when the validation is finished
            it('Should not allow anonymous user to write into user locations', () => {
                expect(null).cannot.write({test: 'data'}).path('/users/user1/location');
            });

            it('Should allow authenticated user to write into her location', () => {
                expect({uid: 'user1'}).can.write({test: 'data'}).path('/users/user1/location');
            });

            it('Should not allow authenticated user to write into other user locations', () => {
                expect({uid: 'user2'}).cannot.write({test: 'data'}).path('/users/user1/location');
            });
        });
    });

    describe('Validation', () => {
        it('Should validate profile', () => {
            let profile = getProfile();
            expect({uid: 'user1'}).can.write(profile).path('/users/user1/profile');

            profile = 'test';
            expect({uid: 'user1'}).cannot.write(profile).path('/users/user1/profile');

            profile = null;
            expect({uid: 'user1'}).cannot.write(profile).path('/users/user1/profile');
        });

        it('Should validate uid', () => {
            const profile = getProfile();

            profile.uid = 'user2';
            expect({uid: 'user1'}).cannot.write(profile).path('/users/user1/profile');
        });

        it('Should validate firstName', () => {
            const profile = getProfile();

            profile.firstName = 123;
            expect({uid: 'user1'}).cannot.write(profile).path('/users/user1/profile');

            profile.firstName = {test: 'data'};
            expect({uid: 'user1'}).cannot.write(profile).path('/users/user1/profile');

            profile.firstName = null;
            expect({uid: 'user1'}).cannot.write(profile).path('/users/user1/profile');
        });

        it('Should validate lastName', () => {
            const profile = getProfile();

            profile.lastName = 123;
            expect({uid: 'user1'}).cannot.write(profile).path('/users/user1/profile');
            
            profile.lastName = {test: 'data'};
            expect({uid: 'user1'}).cannot.write(profile).path('/users/user1/profile');

            profile.lastName = null;
            expect({uid: 'user1'}).cannot.write(profile).path('/users/user1/profile');
        });

        it('Should validate interests', () => {
            const profile = getProfile();

            profile.interests = 123;
            expect({uid: 'user1'}).cannot.write(profile).path('/users/user1/profile');
            
            profile.interests = {test: 'data'};
            expect({uid: 'user1'}).cannot.write(profile).path('/users/user1/profile');

            profile.interests = null;
            expect({uid: 'user1'}).cannot.write(profile).path('/users/user1/profile');
        });

        it('Should validate about', () => {
            const profile = getProfile();

            profile.about = 123;
            expect({uid: 'user1'}).cannot.write(profile).path('/users/user1/profile');
            
            profile.about = {test: 'data'};
            expect({uid: 'user1'}).cannot.write(profile).path('/users/user1/profile');

            profile.about = null;
            expect({uid: 'user1'}).cannot.write(profile).path('/users/user1/profile');
        });

        it('Should validate gender', () => {
            const profile = getProfile();

            profile.gender = 'not a valid gender';
            expect({uid: 'user1'}).cannot.write(profile).path('/users/user1/profile');
            
            profile.gender = {test: 'data'};
            expect({uid: 'user1'}).cannot.write(profile).path('/users/user1/profile');

            profile.gender = null;
            expect({uid: 'user1'}).cannot.write(profile).path('/users/user1/profile');
        });

        it('Should validate photos', () => {
            const profile = getProfile();

            profile.photos = ['1', '2', '3', '4', '5', '6', '7'];
            expect({uid: 'user1'}).cannot.write(profile).path('/users/user1/profile');

            profile.photos = {'6': 'test'};
            expect({uid: 'user1'}).cannot.write(profile).path('/users/user1/profile');
            
            profile.photos = 'Some string';
            expect({uid: 'user1'}).cannot.write(profile).path('/users/user1/profile');

            profile.photos = null;
            expect({uid: 'user1'}).can.write(profile).path('/users/user1/profile');

            profile.photos = [];
            expect({uid: 'user1'}).can.write(profile).path('/users/user1/profile');
        });
    });
});