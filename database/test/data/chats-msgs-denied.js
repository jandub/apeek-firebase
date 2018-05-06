/**
 *  Data for testing rules - chats and messages nodes - denied
 */

const { PATH_CONSTS } = require('./../paths');
const consts = require.main.require(PATH_CONSTS);

module.exports = {
    chats: {
        user1: {
            chat_id: {
                lastMsgSenderId: 'user1',
                status: consts.CHAT_STATUS_DENIED
            }
        },
        user2: {
            chat_id: {
                lastMsgSenderId: 'user1',
                status: consts.CHAT_STATUS_DENIED
            }
        }
    },
    messages: {
        chat_id: {
            msg_den_id: {
                senderId: 'user2',
                recipientId: 'user1',
                ts: 1234567891,
                text: '',
                type: consts.MSG_TYPE_DENIED,
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