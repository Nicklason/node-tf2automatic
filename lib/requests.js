'use strict';

const Automatic = require('./automatic.js');

Automatic.prototype._authenticate = function (callback) {
    this.authenticating = true;

    const path = {
        version: 'v1',
        face: 'authenticate'
    };

    const input = {
        client_id: this.client_id,
        client_secret: this.client_secret
    };

    const self = this;
    self._apiCall('GET', path, input, function (err, result) {
        self.authenticating = false;
        if (err) {
            if (err.messages && err.messages.indexOf('subscription is invalid or has expired') != -1) {
                self.stop();
                err.retry = false;
            }
            return callback(err);
        }

        self.token = result;
        self.emit('token', self.token);
        callback(null, self.token);
    });
};

Automatic.prototype._fetchCurrencies = function (callback) {
    const path = {
        version: 'v1',
        face: 'currencies'
    };
    
    const self = this;
    self._apiCall('GET', path, function (err, result) {
        if (err) {
            return callback(err);
        }

        self.currencies = result;
        self.emit('currencies', self.currencies);
        callback(null, self.currencies);
    });
};

Automatic.prototype._fetchListings = function (callback) {
    const path = {
        version: 'v1',
        face: 'listings'
    };

    const self = this;
    self._apiCall('GET', path, function (err, listings) {
        if (err) {
            return callback(err);
        }

        self._findUpdates(listings);
        self.listings = listings;
        self.emit('listings', self.listings);

        callback(null, self.listings);
    });
};

Automatic.prototype._addListing = function (item, callback) {
    const path = {
        version: 'v1',
        face: 'listings'
    };

    const input = item;

    const self = this;
    self._apiCall('POST', path, input, function (err, result) {
        if (err) {
            return callback(err);
        }

        self._add(result);
        callback(null, result);
    });
};

Automatic.prototype._updateListing = function (name, update, callback) {
    const path = {
        version: 'v1',
        face: 'listings'
    };

    let input = update;
    input.name = name;

    const self = this;
    self._apiCall('PUT', path, input, function (err, result) {
        if (err) {
            return callback(err);
        }

        self._update(result);
        callback(null, result);
    });
};

Automatic.prototype._removeListings = function (items, callback) {
    const path = {
        version: 'v1',
        face: 'listings'
    };

    const input = items;

    const self = this;
    self._apiCall('DELETE', path, input, function (err, result) {
        if (err) {
            return callback(err);
        }

        self._remove(items);
        callback(null, result);
    });
};

Automatic.prototype._removeAllListings = function (input, callback) {
    const path = {
        version: 'v1',
        face: 'listings',
        method: 'all'
    };

    const self = this;
    self._apiCall('DELETE', path, input, function (err, result) {
        if (err) {
            return callback(err);
        }

        const items = [];
        for (let i = 0; i < self.listings.length; i++) {
            const name = self.listings[i].name;
            items.push(name);
        }

        self._remove(items);
        callback(null, result);
    });
};

Automatic.prototype._upload = function (data, type, callback) {
    const path = {
        version: 'v1',
        face: 'trades',
        method: 'upload',
        form: true
    };

    const form = {
        trade: {
            value: data,
            options: {
                filename: 'trade',
                contentType: type
            }
        }
    };

    this._apiCall('POST', path, form, function (err, result) {
        if (err) {
            return callback(err);
        }

        callback(null, result);
    });
};