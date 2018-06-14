/* eslint no-console: 0, no-unused-vars: 0 */

var Automatic = require('../index.js');
var fs = require('fs');

var options = {
    client_id: '',
    client_secret: ''
};

var automatic = new Automatic(options);

if (fs.existsSync('listings.json')) {
    // Add the cached prices.
    automatic.listings = JSON.parse(fs.readFileSync('listings.json'));
}

automatic.init(function (err) {
    if (err) {
        console.log(err);
        return;
    }

    automatic.addListing({
        defindex: 5021,
        quality: 6,
        craftable: true,
        killstreak: 0,
        australium: false,
        effect: null,
        autoprice: true,
        enabled: true
    }, function (err, listing) {
        if (err) {
            console.log(err);
            return;
        }

        automatic.updateListing('Mann Co. Supply Crate Key', { meta: { foo: 'bar' } }, function (err) {
            if (err) {
                console.log(err);
                return;
            }

            automatic.removeListing('Mann Co. Supply Crate Key', function (err) {
                if (err) {
                    console.log(err);
                    return;
                }

                console.log(automatic.findListing('Mann Co. Supply Crate Key'));
                // -> null (item is no longer in the pricelist)
            });
        });
    });
});

// Event for staying up to date with the prices.
automatic.on('change', function (state, listing) {
    switch (state) {
        case 1:
            console.log(listing.name + ' has been added to the pricelist');
            break;
        case 2:
            console.log(listing.name + ' has changed');
            break;
        case 3:
            console.log(listing.name + ' is no longer in the pricelist');
            break;
    }
});

// Event for when the prices has been requested / updated, use this to cache the prices.
automatic.on('listings', function (listings) {
    fs.writeFileSync('listings.json', JSON.stringify(listings));
});

automatic.on('currencies', function (currencies) {});
automatic.on('rate', function (rate) {});