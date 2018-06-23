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