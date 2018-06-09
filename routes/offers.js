/*
 *  offers.js
 *  ---------
 *  Handles all routes regarding viewing, creating, and modifying offers.
 */

var createError = require('http-errors');
var uuidv1 = require('uuid/v1');
var express = require('express');
var router = express.Router();

var admin = require('./auth');
var utils = require('./utils');

var db = admin.database();
var offers = db.ref('offers');
var users = db.ref('users');

/*
 ********************
 **  GET Requests  **
 ********************
 */

/* Get all offers. */
router.get('/', function(req, res, next) {

  offers.once('value').then((snap) => {
    // Verify that the 'offers' dictionary exists
    if (snap.val() === null)
      throw new Error("'Offers' table/key missing in database");

    // Return the info about all offers
    let offersInfo = snap.val();
    res.send(offersInfo);

  }).catch((err) => {
    next(createError(500, "Couldn't get all offers: " + err.message));
    return;
  });

});

/* Get info about a specific offer. */
router.get('/:offer_id', function(req, res, next) {
  let offerId = req.params.offer_id;
  let offer = offers.child(offerId);


});

/*
 *********************
 **  POST Requests  **
 *********************
 */

/* Create an offer. */
router.post('/new', function(req, res, next) {

  let offerId = uuidv1();
  let name = req.body.name;
  let description = req.body.description;
  let pictures = {"sentinel": ""}
  let price = req.body.price;
  let seller = req.auth.uid;
  let sellerRef = users.child(seller);
  let sellerOffersRef = sellerRef.child("offers");
  let location = req.body.location;
  let dateAdded = Date.now();
  let isSold = false;

  // Validate input
  let isValid = (utils.isValidOfferName(name) &&
                 utils.isValidOfferDescription(description) &&
                 utils.isValidPrice(price) &&
                 utils.isValidLocation(location));

  if (!isValid) {
    next(createError(400, "Invalid input provided."));
    return;
  }

  let newOffer = offers.child(offerId);
  let offerDict = {
    "offerId": offerId,
    "name": name,
    "description": description,
    "pictures": pictures,
    "price": price,
    "seller": seller,
    "location": location,
    "isSold": false,
    "dateAdded": dateAdded,
    "disabled": false,
  };

  // In the list of offer references under '/users', store the offerId of the
  // newly created offer
  let linkToOffersTable = {
    "offerId": offerId,
  }

  newOffer.set(offerDict, (err) => {
    if (err) { // if an error actually occured
      next(createError(500, "Offer could not be created."));
      return;
    } else {
      let newOfferRef = sellerOffersRef.child(offerId)
      newOfferRef.set(linkToOffersTable);

      res.send("Offer was created successfully.");
    }
  });

});

/* Edit an offer. */
router.post('/:offer_id/edit', function(req, res, next) {
  let offerId = req.params.offer_id;

  // Get the edits requested
  let edits = req.body.edits;
  try {
    edits = JSON.parse(edits);
  } catch (e) {
    next(createError(400, "Edits were not provided in JSON format."));
    return;
  }

  //TODO: validate edits



});


module.exports = router;
