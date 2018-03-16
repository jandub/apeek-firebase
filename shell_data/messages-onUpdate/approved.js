dbMessagesOnUpdate({
        before: {
            senderId: 'LEx6SCm9iePVPfDKNWsEnAyjVG75',
            recipientId: 'LEx6SCm9iePVPfDKNWsEnAyjVG74',
            text: '',
            ts: 1234567891,
            type: 'approved',
            status: 'delivered'
        },
        after: {
            senderId: 'LEx6SCm9iePVPfDKNWsEnAyjVG75',
            recipientId: 'LEx6SCm9iePVPfDKNWsEnAyjVG74',
            text: '',
            ts: 1234567891,
            type: 'approved',
            status: 'read'
        }
    },
    {
        auth: {
            variable: {
                uid: 'LEx6SCm9iePVPfDKNWsEnAyjVG74'
            }
        },
        params: {
            chatId: 'test_chat_id', 
            messageId: 'test_msg_app_id'
        }
    });