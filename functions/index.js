'use strict';

process.env.DEBUG = 'actions-on-google:*';

const http = require('http');

const {dialogflow} = require('actions-on-google');

// Import the firebase-functions package for deployment.
const functions = require('firebase-functions');

// Instantiate the Dialogflow client.
const app = dialogflow({debug: true});

// a. the action name from the make_name Dialogflow intent
const TOGGLE_XMAS = 'toggle_xmas';
const TOGGLE_OFFICE = 'toggle_office';
const TOGGLE_MISC = 'Default Welcome Intent';

const XMAS_SWITCH_ID = 'sw1';
const OFFICE_SWITCH_ID = 'sw2';
const MISC_SWITCH_ID = 'sw3';

const XMAS_SWITCH_ON_PHASE = 'Merry Christmas';
const XMAS_SWITCH_OFF_PHASE = 'Merry Christmas to all, and to all a good night!';

const OFFICE_SWITCH_ON_PHASE = 'Time to get to work';
const OFFICE_SWITCH_OFF_PHASE = 'All work and no play make Homer something something';

const MISC_SWITCH_ON_PHASE = 'Turning on switch 3';
const MISC_SWITCH_OFF_PHASE = 'Turning off switch 3';

const API_HOSTNAME = process.env.API_HOSTNAME;
const API_PORT = process.env.API_PORT;
const API_PATH = '/api/switches/';
const API_PASSWORD = process.env.API_PASSWORD;

const ERROR_MESSAGE = 'An error has occurred, please try again later';

app.intent(TOGGLE_XMAS, (conv) => {
    return new Promise((resolve, reject)  => {
        toggleSwitchAndRespond(XMAS_SWITCH_ID, XMAS_SWITCH_ON_PHASE, XMAS_SWITCH_OFF_PHASE, conv).then((phrase) => {
            conv.close(phrase);
            resolve();
        }).catch((error) => {
            console.log(error);
            conv.close(ERROR_MESSAGE);
            resolve();
        });
    });
});

app.intent(TOGGLE_OFFICE, (conv) => {
    return new Promise((resolve, reject)  => {
        toggleSwitchAndRespond(OFFICE_SWITCH_ID, OFFICE_SWITCH_ON_PHASE, OFFICE_SWITCH_OFF_PHASE, conv).then((phrase) => {
            conv.close(phrase);
            resolve();
        }).catch((error) => {
            console.log(error);
            conv.close(ERROR_MESSAGE);
            resolve();
        });
    });
});

app.intent(TOGGLE_MISC, (conv) => {
    return new Promise((resolve, reject)  => {
        toggleSwitchAndRespond(MISC_SWITCH_ID, MISC_SWITCH_ON_PHASE, MISC_SWITCH_OFF_PHASE, conv).then((phrase) => {
            conv.close(phrase);
            resolve();
        }).catch((error) => {
            console.log(error);
            conv.close(ERROR_MESSAGE);
            resolve();
        });
    });
});

exports.lightsToggle = functions.https.onRequest(app);

const toggleSwitchAndRespond = (switchId, switchPhraseOn, switchPhraseOff, conv) => {
    return new Promise((resolve, reject) => {
        getSwitchState(switchId).then((oldState) => {
            toggleSwitchState(switchId).then((newState) => {
                var switchPhrase = switchPhraseOn;
                if (newState == 'off') {
                    switchPhrase = switchPhraseOff;
                }
                resolve(switchPhrase);
            }).catch((error) => {
                reject(error);
            });
        }).catch((error) => {
            reject(error);
        })
    });
};

const getSwitchState = (switchId) => {
    return new Promise((resolve, reject) => {
        makeApiRequest('GET', API_PATH + switchId).then((response) => {
            if (response.statusCode == 200) {
                resolve(response.body);
            } else {
                reject(response.statusCode);
            }
        }).catch((error) => {
            reject(error);
        });
    });
};

const toggleSwitchState = (switchId) => {
    return new Promise((resolve, reject) => {
        makeApiRequest('POST', API_PATH + switchId, { password: API_PASSWORD }).then((response) => {
            if (response.statusCode == 200) {
                resolve(response.body);
            } else {
                reject(response.statusCode);
            }
        }).catch((error) => {
            reject(error);
        });
    });
};
const makeApiRequest = (method, path, body) => {
    const options = {
        hostname: API_HOSTNAME,
        port: API_PORT,
        path: path,
        headers: {
            'Content-Type': 'application/json'
        },
        method: method
    };

    return new Promise((resolve, reject) => {

        const request = http.request(options, (resp) => {
            let data = '';

            // A chunk of data has been recieved.
            resp.on('data', (chunk) => {
                data += chunk;
            });

            // The whole response has been received. Print out the result.
            resp.on('end', () => {
                var body = {};
                try {
                    body = JSON.parse(data);
                    resolve({
                        statusCode: resp.statusCode,
                        headers: resp.headers,
                        body: body
                    });
                } catch (error) {
                    reject(error);
                }
            });

        }).on("error", (err) => {
            console.log("error", err);
            reject(err);
        });

        if (body) {
            request.write(JSON.stringify(body));
        }
        request.end();
    });
};