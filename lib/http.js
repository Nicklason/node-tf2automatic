'use strict';

const request = require('request');
const isObject = require('isobject');

const Automatic = require('./automatic.js');

Automatic.prototype._httpRequest = function (uri, options, callback) {
    if (typeof uri == 'object') {
        callback = options;
        options = uri;
        uri = options.url || options.uri;
    } else if (typeof options == 'function') {
        callback = options;
        options = {};
    }

    const self = this;
    request(options, function (err, response, body) {
        const hasCallback = !!callback;
        const httpError = options.checkHttpError !== false && self._checkHttpError(err, response, body, callback);
        const jsonError = options.json && !body ? new Error('Malformed JSON response') : null;

        if (hasCallback && !(httpError || jsonError)) {
            if (jsonError) {
                callback.call(this, jsonError);
            } else {
                callback.apply(this, arguments);
            }
        }
    });
};

Automatic.prototype._checkHttpError = function (err, response, body, callback) {
    if (err) {
        callback(err, response, body);
        return err;
    }

    if (response.statusCode == 400) {
        err = new Error('Bad Request');
        err.statusCode = response.statusCode;
        err.messages = _getErrorMessages(body);
        callback(err, response, body);
        return err;
    }

    if (response.statusCode == 401) {
        err = new Error('Unauthorized');
        err.statusCode = response.statusCode;
        err.messages = _getErrorMessages(body);
        if (this.token == null && this.authenticating == false) {
            this.stop();
            err.retry = false;
        }
        this.token = null;
        callback(err, response, body);
        return err;
    }

    if (response.statusCode != 200) {
        err = new Error('HTTP Error ' + response.statusCode);
        err.statusCode = response.statusCode;
        err.messages = _getErrorMessages(body);
        callback(err, response, body);
        return err;
    }

    return false;
};

function _getErrorMessages(body) {
    let messages = [];
    if (isObject(body) && body.hasOwnProperty('errors')) {
        for (let i = 0; i < body.errors.length; i++) {
            const error = body.errors[i];
            messages.push(error.message);
        }
    }
    return messages;
}