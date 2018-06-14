'use strict';

const Automatic = require('./automatic.js');

/**
 * Get a new token
 * @param {function} [callback] Function to call when done
 */
Automatic.prototype.refreshToken = function (callback) {
    this._retry(Automatic.prototype._authenticate.bind(this), callback);
};

/**
 * Get currencies
 * @param {function} [callback] Function to call when done
 */
Automatic.prototype.getCurrencies = function (callback) {
    this._retry(Automatic.prototype._fetchCurrencies.bind(this), callback);
};

/**
 * Get the pricelist
 * @param {function} [callback] Function to call when done
 */
Automatic.prototype.getListings = function (callback) {
    this._retry(Automatic.prototype._fetchListings.bind(this), callback);
};

/**
 * Add an item to the pricelist
 * @param {Object} item Item to add
 * @param {funciton} [callback] Function to call when done
 */
Automatic.prototype.addListing = function (item, callback) {
    this._retry(Automatic.prototype._addListing.bind(this, item), callback);
};

/**
 * Update item in the pricelist
 * @param {string} name Name of the item to update
 * @param {Object} update Properties to update
 * @param {function} [callback] Function to call when done
 */
Automatic.prototype.updateListing = function (name, update, callback) {
    this._retry(Automatic.prototype._updateListing.bind(this, name, update), callback);
};

/**
 * Remove a single item from the pricelist
 * @param {string} name Item to remove
 * @param {function} [callback] Function to call when done
 */
Automatic.prototype.removeListing = function (name, callback) {
    this._retry(Automatic.prototype._removeListings.bind(this, [name]), callback);
};

/**
 * Remove multiple items from the pricelist
 * @param {string[]} names Items to remove
 * @param {function} [callback] Function to call when done
 */
Automatic.prototype.removeListings = function (names, callback) {
    this._retry(Automatic.prototype._removeListings.bind(this, names), callback);
};

/**
 * Attempts to get a successful response from an async function
 * @param {function} method Asynchronous function that you want to attempt to run
 * @param {function} [callback] Function to call when done
 * @param {number} [attempt=0] Unsuccessful attempts made
 */
Automatic.prototype._retry = function (method, callback, attempt = 0) {
    const self = this;
    method(function (err, result) {
        attempt++;
        if (self._shouldAuthenticate(err)) {
            self.refreshToken(function () {
                self._retry(method, callback);
            });
        } else if (self._shouldRetry(err, attempt)) {
            const wait = self._createTimeout();
            setTimeout(Automatic.prototype._retry.bind(self, method, callback, attempt), wait);
        } else if (callback) {
            callback(err, result);
        }
    });
};

Automatic.prototype._shouldRetry = function (err, attempt) {
    return err && err.hasOwnProperty('statusCode') && (err.statusCode == 429 || err.statusCode > 499) && attempt < this.maxRetries;
};

Automatic.prototype._shouldAuthenticate = function (err) {
    return err && err.hasOwnProperty('statusCode') && err.statusCode == 401 && this.token != null;
};

Automatic.prototype._createTimeout = function (attempt) {
    const random = Math.random() + 1;
    let timeout = Math.round(random * this.minTimeout * Math.pow(this.retryFactor, attempt));
    timeout = Math.min(timeout, this.maxTimeout);

    return timeout;
};