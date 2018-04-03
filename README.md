# Apeek Firebase

## Installation
1. Install or have previously installed:
	* [Python 2.7.9+](https://www.python.org) (includes package manager pip)
	* [Google Cloud SDK](https://cloud.google.com/sdk/)
	* [npm](https://www.npmjs.com/get-npm)

2. Clone the repository
```
$ git clone https://github.com/jandub/apeek-firebase.git
```
and change directory to the ```apeek-firebase``` directory.
```
$ cd apeek-firebase
```

3. Install dependencies
```
$ npm install
```

4. Login to Firebase
```
npm run login
```

5. Configure the gcloud command-line tool to use this project
```
$ gcloud config set project apeek-ca78d
```
change directory to ```appengine```
```
$ cd appengine
```
and create an App Engine App
```
$ gcloud app create
```

## Deploying
Deploy everything to Firebase and Google Cloud
```
$ npm run deploy
```
or deploy just a single part of the project:
* Firebase functions  
```$ npm run deploy:functions```
* Firebase database rules  
```$ npm run deploy:database```
* Firebase storage rules  
```$ npm run deploy:storage```
* Google Cloud App  
```$ npm run deploy:cloud```

## Testing
Run the tests using
```
$ npm test
```
or run just the tests for a part of the project
* Database rules tests  
```$ npm run test:rules```
* Firebase functions unit tests  
```$ npm run test:functions```

## Development

### Database rules
Rules are written using [Bolt](https://github.com/firebase/bolt) - more information about this language can be found in [language docs](https://github.com/firebase/bolt/blob/master/docs/language.md) and in the [guide](https://github.com/firebase/bolt/blob/master/docs/guide.md).  
Translate the Bolt rules to json using
```
$ npm build
```

### Firebase functions
Functions can be tested locally using experimental shell
```
$ npm run shell
```
Although the functions are run locally they still use the live database.
  
Testing data for the shell can be found in ```shell_data``` directory in project root. Usage:
```
$ npm run shell < shell_data/messages-onCreate/request.js
```
