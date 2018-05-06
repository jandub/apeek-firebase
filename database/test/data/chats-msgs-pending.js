/**
 *  Data for testing rules - chats and messages nodes - request
 */

const { PATH_CONSTS } = require('./../paths');
const consts = require.main.require(PATH_CONSTS);

module.exports = {
    chats: {
        user1: {
            chat_id: {
                lastMsgSenderId: 'user1',
                status: consts.CHAT_STATUS_PENDING
            }
        },
        user2: {
            chat_id: {
                lastMsgSenderId: 'user1',
                status: consts.CHAT_STATUS_PENDING
            }
        }
    },
    messages: {
        chat_id: {
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