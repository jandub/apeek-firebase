/**
 *  Data for testing rules - with chat approved
 */

const {PATH_CONSTS} = require('./../paths');
const consts = require.main.require(PATH_CONSTS);

module.exports = {
    users: {
        user1: {
            profile: {
                uid: 'user1',
                firstName: 'Firstname1',
                lastName: 'Lastname1',
                gender: consts.GENDER_MALE,
                interests: 'Some interests 1...',
                about: 'Something about user1...',
                photos: ['photolink']
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
                uid: 'user2',
                firstName: 'Firstname2',
                lastName: 'Lastname2',
                gender: consts.GENDER_FEMALE,
                interests: 'Some interests 2...',
                about: 'Something about user2...',
                photos: ['photolink1', 'photolink2', 'photolink3']
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
                uid: 'user3',
                firstName: 'Firstname3',
                lastName: 'Lastname3',
                gender: consts.GENDER_MALE,
                interests: 'Some interests 3...',
                about: 'Something about user3...',
                photos: [
                    'photolink1', 'photolink2', 'photolink3', 
                    'photolink4', 'photolink5', 'photolink6'
                ]
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