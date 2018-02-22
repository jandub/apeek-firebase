dbMessagesOnUpdate({
        before: {
            senderId: 'LEx6SCm9iePVPfDKNWsEnAyjVG74',
            recipientId: 'LEx6SCm9iePVPfDKNWsEnAyjVG75',
            text: '',
            ts: 1234567890,
            type: 'request',
            status: 'delivered'
        },
        after: {
            senderId: 'LEx6SCm9iePVPfDKNWsEnAyjVG74',
            recipientId: 'LEx6SCm9iePVPfDKNWsEnAyjVG75',
            text: '',
            ts: 1234567890,
            type: 'request',
            status: 'read'
        }
    },
    {
        auth: {
            variable: {
                uid: 'LEx6SCm9iePVPfDKNWsEnAyjVG75'
            }
        },
        params: {
            chatId: 'test_chat_id', 
            messageId: 'test_msg_req_id'
        }
    });