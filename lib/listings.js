'use strict';

const Automatic = require('./automatic.js');

/**
 * Get listing of an item
 * @param {string} name Name of the item you want to find
 */
Automatic.prototype.findListing = function (search) {
    for (let i = 0; i < this.listings.length; i++) {
        const name = this.listings[i].name;
        if (search == name) {
            return this.listings[i];
        }
    }

    return null;
};

/**
 * Get item object from a listing
 * @param {Object} listing Listing you want to get the item from
 */
Automatic.prototype.getItem = function (listing) {
    const item = {
        name: listing.name,
        defindex: listing.defindex,
        quality: listing.quality,
        craftable: listing.craftable,
        killstreak: listing.killstreak,
        australium: listing.australium,
        effect: listing.effect
    };
    return item;
};

Automatic.prototype._findUpdates = function (listings) {
    let found = [];

    const self = this;
    // Find items that are new, updated and removed.
    self.listings.forEach(function (listing) {
        const match = findItem(listing.name, listings);
        if (match == null) {
            self.emit('change', 3, self.getItem(listing));
        } else if (JSON.stringify(listing.prices) != JSON.stringify(match.prices)) {
            self.emit('change', 2, self.getItem(listing), listing.prices);
            found.push(match);
        } else {
            found.push(match);
        }
    });

    if (listings.length - found.length > 0) {
        let count = listings.length - found.length;
        for (let i = 0; i < listings.length; i++) {
            if (count == 0) {
                break;
            }
            const name = listings[i].name;
            const match = findItem(name, found);
            if (match == null) {
                self.emit('change', 1, self.getItem(listings[i]), listings[i].prices);
                count--;
            }
        }
    }
};

Automatic.prototype._add = function (listing, event = true) {
    this.listings.push(listing);
    if (event == true) {
        this.emit('change', 1, this.getItem(listing), listing.prices);
        this.emit('prices', this.listings);
    }
};

Automatic.prototype._update = function (listing) {
    this._remove([listing.name ], false);
    this._add(listing, false);
    this.emit('change', 2, listing);
    this.emit('listings', this.listings);
};

Automatic.prototype._remove = function (names, event = true) {
    let doneSomething = false;
    for (let i = this.listings.length; i--;) {
        if (names.length == 0) {
            break;
        }

        let found = false;
        for (let j = names.length; j--;) {
            if (this.listings[i].name == names[j]) {
                names.splice(j, 1);
                found = true;
                break;
            }
        }

        if (found == true) {
            const listing = this.listings[i];
            this.listings.splice(i, 1);
            if (event == true) {
                this.emit('change', 3, this.getItem(listing));
            }
            doneSomething = true;
        }
    }
    if (doneSomething && event == true) {
        this.emit('listings', this.listings);
    }
};

function findItem(search, listings) {
    for (let i = 0; i < listings.length; i++) {
        const name = listings[i].name;
        if (search == name) {
            return listings[i];
        }
    }
    return null;
}