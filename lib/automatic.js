'use strict';

const async = require('async');

module.exports = Automatic;

require('util').inherits(Automatic, require('events').EventEmitter);

function Automatic(options) {
    options = options || {};

    this.client_id = options.client_id;
    this.client_secret = options.client_secret;
    this.token = null;
    
    this.retry = options.retry || true;
    this.maxRetries = options.maxRetries || 10;
    this.retryFactor = options.retryFactor || 2;
    this.minTimeout = options.minTimeout || 1 * 1000;
    this.maxTimeout = options.maxTimeout || 2 * 1000;

    this.pollTime = options.pollTime || 5 * 60 * 1000;
    this.currencyTime = options.currencyTime || 30 * 60 * 1000;

    this.listings = [];
    this.currencies = {};
}

/**
 * Initialize the module
 * @param {function} callback Function to call when done
 */
Automatic.prototype.init = function (callback) {
    // Start by getting a token
    this._initialize(callback);
};

Automatic.prototype._initialize = function (callback) {
    const self = this;
    async.series([
        function (cb) {
            self.refreshToken(cb);
        },
        function (cb) {
            self.getCurrencies(cb);
        },
        function (cb) {
            self.getListings(cb);
        }
    ], function (err) {
        if (err) {
            return callback(err);
        }

        self.start();
        callback(null);
    });
};

Automatic.prototype.start = function () {
    this._pollTimer = setInterval(Automatic.prototype.getListings.bind(this), this.pollTime);
    this._currencyTimer = setInterval(Automatic.prototype.getCurrencies.bind(this), this.currencyTime);
};

Automatic.prototype.stop = function () {
    clearInterval(this._pollTimer);
    this.listings = [];

    clearInterval(this._currencyTimer);
    this.currencies = {};
};

require('./api.js');
require('./http.js');
require('./requests.js');
require('./methods.js');
require('./listings.js');