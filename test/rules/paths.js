/**
 *  Paths for testing rules
 * 
 *  Use reference to initial global require for these
 *  Using relative path wouldn't work with constants
 *
 *  `require.main.require(*path*)`
 *  https://gist.github.com/branneman/8048520
 *  
 */

module.exports = {
    PATH_CONSTS: "functions/constants.js",
    PATH_RULES: "database/database.rules.json",
    PATH_DATA: "test/rules/data"
};