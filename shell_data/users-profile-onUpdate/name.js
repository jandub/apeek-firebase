/* eslint-disable-next-line no-undef */
dbUsersProfileOnUpdate(
    {
        before: {
            uid: 'LEx6SCm9iePVPfDKNWsEnAyjVG75',
            firstName: 'Tereza',
            lastName: 'Name',
            gender: 'female',
            interests: 'Some interests 1...',
            about: 'Some about 1...'
        },
        after: {
            uid: 'LEx6SCm9iePVPfDKNWsEnAyjVG75',
            firstName: 'Markéta',
            lastName: 'NewLastName',
            gender: 'male',
            interests: 'Some interests 1...',
            about: 'Some about 1...'
        }
    },
    {
        auth: {
            variable: {
                uid: 'LEx6SCm9iePVPfDKNWsEnAyjVG75'
            }
        },
        params: {
            userId: 'LEx6SCm9iePVPfDKNWsEnAyjVG75'
        }
    }
);