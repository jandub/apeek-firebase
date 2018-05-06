/** EXPORT ALL FUNCTIONS
 *
 *   Loads all `.func.js` files in `functions` directory
 *   Exports a cloud function matching the file name and its path
 *
 *   Based on this thread:
 *      https://github.com/firebase/functions-samples/issues/170
 *   And this article:
 *      https://codeburst.io/organizing-your-firebase-cloud-functions-67dc17b3b0da
 */

const glob = require('glob');
const camelCase = require('camelcase');

const files = glob.sync('./**/*.func.js', { cwd: __dirname, ignore: './node_modules/**' });

files.forEach(file => {
    // Strip off '.func.js' from the end of filename
    const functionName = camelCase(file.slice(0, -8).split('/').join('_'));

    if (!process.env.FUNCTION_NAME || process.env.FUNCTION_NAME === functionName) {
        // eslint-disable-next-line global-require, import/no-dynamic-require
        exports[functionName] = require(file);
    }
});