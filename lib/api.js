'use strict';

const Automatic = require('./automatic.js');

Automatic.prototype._apiCall = function (httpMethod, path, input, callback) {
    if (typeof input == 'function') {
        callback = input;
        input = null;
    }

    const version = path.version;
    const face = path.face;
    const method = path.method;

    let uri = `https://api.tf2automatic.com/${version}/${face}`;
    if (method) {
        uri += `/${method}`;
    }

    let options = {
        uri: uri,
        method: httpMethod,
        json: true,
        gzip: true,
        timeout: 10000
    };

    if (path != 'authenticate') {
        options.headers = {
            'Authorization': this.token
        };
    }

    input = input || {};
    options[httpMethod == 'GET' ? 'qs' : 'body'] = input;

    const self = this;
    self._httpRequest(options, function (err, response, body) {
        if (err) {
            return callback(err);
        }

        if (!body || typeof body != 'object') {
            return callback(new Error('Invalid API response'));
        }

        const rate = body.rate;
        if (rate) {
            self.rate = rate;
            self.emit('rate', self.rate);
        }

        callback(null, body.result);
    });
};