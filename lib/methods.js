'use strict';

const Automatic = require('./automatic.js');

/**
 * Get a new token
 * @param {function} [callback] Function to call when done
 */
Automatic.prototype.refreshToken = function (callback) {
    if (this.authenticating == true) {
        return this.once('token', function (token) {
            callback(null, token);
        });
    }

    this._retry(Automatic.prototype._authenticate.bind(this), callback, { name: 'refreshToken' });
};

/**
 * Get currencies
 * @param {function} [callback] Function to call when done
 */
Automatic.prototype.getCurrencies = function (callback) {
    this._retry(Automatic.prototype._fetchCurrencies.bind(this), callback, { name: 'getCurrencies' });
};

/**
 * Get the pricelist
 * @param {function} [callback] Function to call when done
 */
Automatic.prototype.getListings = function (callback) {
    this._retry(Automatic.prototype._fetchListings.bind(this), callback, { name: 'getListings' });
};

/**
 * Add an item to the pricelist
 * @param {Object} item Item to add
 * @param {funciton} [callback] Function to call when done
 */
Automatic.prototype.addListing = function (item, callback) {
    this._retry(Automatic.prototype._addListing.bind(this, item), callback, { name: 'addListing' });
};

/**
 * Update item in the pricelist
 * @param {string} name Name of the item to update
 * @param {Object} update Properties to update
 * @param {function} [callback] Function to call when done
 */
Automatic.prototype.updateListing = function (name, update, callback) {
    this._retry(Automatic.prototype._updateListing.bind(this, name, update), callback, { name: 'removeListing' });
};

/**
 * Remove a single item from the pricelist
 * @param {string} name Item to remove
 * @param {function} [callback] Function to call when done
 */
Automatic.prototype.removeListing = function (name, callback) {
    this._retry(Automatic.prototype._removeListings.bind(this, [name]), callback, { name: 'removeListing' });
};

/**
 * Remove multiple items from the pricelist
 * @param {string[]} names Items to remove
 * @param {function} [callback] Function to call when done
 */
Automatic.prototype.removeListings = function (names, callback) {
    this._retry(Automatic.prototype._removeListings.bind(this, names), callback, { name: 'removeListings' });
};

/**
 * Remove all items from the pricelist
 * @param {boolean} sure Are you sure to remove all
 * @param {*} [callback] Function to call when done
 */
Automatic.prototype.removeAllListings = function (callback) {
    this._retry(Automatic.prototype._removeAllListings.bind(this, { i_know_what_i_am_doing: true }), callback, { name: 'removeAllListings' });
};

/**
 * Upload picture to server
 * @param {*} data Image to send
 * @param {*} [callback] Function to call when done
 */
Automatic.prototype.upload = function (data, type, callback) {
    this._retry(Automatic.prototype._upload.bind(this, data, type), callback, { name: 'upload' });
};

/**
 * Attempts to get a successful response from an async function
 * @param {function} method Asynchronous function that you want to attempt to run
 * @param {function} [callback] Function to call when done
 * @param {number} [attempt=0] Unsuccessful attempts made
 */
Automatic.prototype._retry = function (method, callback, meta) {
    if (meta == undefined) {
        meta = {};
    }
    if (meta.attempt == undefined) {
        meta.attempt = 0;
    }
    if (meta.time == undefined) {
        meta.time = new Date().getTime();
    }

    const self = this;
    method(function (err, result) {
        meta.attempt++;
        if (self._shouldAuthenticate(err)) {
            self.refreshToken(function () {
                self._retry(method, callback, meta);
            });
        } else if (self._shouldRetry(err, meta)) {
            const wait = self._createTimeout(meta.attempt);
            setTimeout(Automatic.prototype._retry.bind(self, method, callback, meta), wait);
        } else {
            const end = new Date().getTime();
            const time = (end - meta.time) / 1000;
            if (callback) {
                callback(err, result, time);
            }

            if (err && self.listeners('error').length > 0) {
                self.emit('error', meta.name, err);
            }
        }
    });
};

Automatic.prototype._shouldRetry = function (err, meta) {  
    return err && err.hasOwnProperty('statusCode') && (err.statusCode == 429 || err.statusCode > 499) && meta.attempt < this.maxRetries && err.retry != false;
};

Automatic.prototype._shouldAuthenticate = function (err) {
    return err && err.hasOwnProperty('statusCode') && err.statusCode == 401 && err.retry != false;
};

Automatic.prototype._createTimeout = function (attempt) {
    const random = Math.random() + 1;
    let timeout = Math.round(random * this.minTimeout * Math.pow(this.retryFactor, attempt));
    timeout = Math.min(timeout, this.maxTimeout);

    return timeout;
};