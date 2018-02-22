/**
 *  Data for testing rules - with chat approved
 */

const {PATH_CONSTS} = require('./../paths');
const consts = require.main.require(PATH_CONSTS);

module.exports = {
    users: {
        user1: {
            profile: {
                firstName: 'Firstname1',
                lastName: 'Lastname1',
                gender: consts.GENDER_MALE,
                interests: 'Some interests 1...',
                about: 'Something about user1...',
                photos: {
                    photo1: 'photolink'
                }
            },
            meta: {
                email: 'user1@email.com'
            },
            location: {
                todo: 'test data'
            }
        },
        user2: {
            profile: {
                firstName: 'Firstname2',
                lastName: 'Lastname2',
                gender: consts.GENDER_FEMALE,
                interests: 'Some interests 2...',
                about: 'Something about user2...',
                photos: {
                    photo1: 'photolink',
                    photo2: 'photolink',
                    photo3: 'photolink'
                }
            },

            meta: {
                email: 'user2@email.com'
            },
            location: {
                todo: 'test data'
            }
        },
        user3: {
            profile: {
                firstName: 'Firstname3',
                lastName: 'Lastname3',
                gender: consts.GENDER_MALE,
                interests: 'Some interests 3...',
                about: 'Something about user3...',
                photos: {
                    photo1: 'photolink',
                    photo2: 'photolink',
                    photo3: 'photolink',
                    photo4: 'photolink',
                    photo5: 'photolink',
                    photo6: 'photolink'
                }
            },
            meta: {
                email: 'user3@email.com'
            },
            location: {
                todo: 'test data'
            }
        }
    },
    chats: {
        user1: {
            chat_id: {
                lastMsgSenderId: 'user1',
                status: consts.CHAT_STATUS_APPROVED
            }
        },
        user2: {
            chat_id: {
                lastMsgSenderId: 'user1',
                status: consts.CHAT_STATUS_APPROVED
            }
        }
    },
    messages: {
        chat_id: {
            msg_app_id: {
                senderId: 'user2',
                recipientId: 'user1',
                ts: 1234567891,
                text: '',
                type: consts.MSG_TYPE_APPROVED,
                status: consts.MSG_STATUS_DELIVERED
            },
            msg_req_id: {
                senderId: 'user1',
                recipientId: 'user2',
                ts: 1234567890,
                text: '',
                type: consts.MSG_TYPE_REQUEST,
                status: consts.MSG_STATUS_DELIVERED
            }
        }
    }
};