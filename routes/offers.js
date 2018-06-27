/*
 *  offers.js
 *  ---------
 *  Handles all routes regarding viewing, creating, and modifying offers.
 */

var createError = require('http-errors')
var uuidv1 = require('uuid/v1')
var express = require('express')
var router = express.Router()

var admin = require('./auth')
var utils = require('./utils')

var db = admin.database()
var offers = db.ref('offers')
var users = db.ref('users')

/*
 ********************
 **  GET Requests  **
 ********************
 */

/* Get all offers. */
router.get('/', function (req, res, next) {
  offers.once('value').then((snap) => {
    // Verify that the 'offers' dictionary exists
    if (snap.val() === null) {
      throw new Error("'Offers' table/key missing in database")
    }

    // Return the info about all offers
    let offersInfo = snap.val()
    res.json(offersInfo)
  }).catch((err) => {
    next(createError(500, "Couldn't get all offers: " + err.message))
  })
})

/* Get info about a specific offer. */
router.get('/:offer_id', function (req, res, next) {
  let offerId = req.params.offer_id
  let offer = offers.child(offerId)

  offer.once('value').then((snap) => {
    // Verify that the offer exists
    if (snap.val() === null) {
      throw new Error("Offer with id '" + offerId + "' doesn't exist.")
    }

    let offerInfo = snap.val()
    res.json(offerInfo)
  }).catch((err) => {
    next(createError(500, "Couldn't get offer: " + err.message))
  })
})

/*
 *********************
 **  POST Requests  **
 *********************
 */

/* Create an offer. */
router.post('/new', function (req, res, next) {
  let offerId = uuidv1()
  let name = req.body.name
  let description = req.body.description
  let pictures = {'sentinel': ''}
  let price = req.body.price
  let seller = req.auth.uid
  let location = req.body.location
  let dateAdded = Date.now()
  let dateSold = ''
  let isSold = false
  let isDisabled = false
  let lockedTo = ''

  let sellerRef = users.child(seller)
  let sellerOffersRef = sellerRef.child('offers')

  // Validate input
  let isValid = (utils.isValidOfferName(name) &&
                 utils.isValidOfferDescription(description) &&
                 utils.isValidPrice(price) &&
                 utils.isValidLocation(location))

  if (!isValid) {
    next(createError(400, 'Invalid input provided.'))
    return
  }

  let newOffer = offers.child(offerId)
  let offerDict = {
    'offerId': offerId,
    'name': name,
    'description': description,
    'pictures': pictures,
    'price': price,
    'seller': seller,
    'location': location,
    'sold': isSold,
    'dateAdded': dateAdded,
    'disabled': isDisabled,
    'dateSold': dateSold,
    'lockedTo': lockedTo
  }

  // In the list of offer references under '/users', store the offerId of the
  // newly created offer
  let linkToOffersTable = {
    'offerId': offerId
  }

  newOffer.set(offerDict, (err) => {
    if (err) { // if an error actually occured
      next(createError(500, 'Offer could not be created.'))
    } else {
      let newOfferRef = sellerOffersRef.child(offerId)
      newOfferRef.set(linkToOffersTable)

      res.send('Offer was created successfully.')
    }
  })
})

/* Edit an offer. */
router.post('/:offer_id/edit', function (req, res, next) {
  let offerId = req.params.offer_id

  // Get the edits requested
  let edits = req.body.edits
  try {
    edits = JSON.parse(edits)
  } catch (e) {
    next(createError(400, 'Edits were not provided in JSON format.'))
  }

  // Validate edits
  const fields = ['name', 'description', 'price', 'location']
  let validFormat = function (key, value) {
    switch (key) {
      case 'name':
        return utils.isValidOfferName(value)
      case 'description':
        return utils.isValidOfferDescription(value)
      case 'price':
        return utils.isValidPrice(value)
      case 'location':
        return utils.isValidLocation(value)
      default:
        return false
    }
  }

  for (const field of fields) {
    if (edits[field] !== undefined && !validFormat(field, edits[field])) {
      next(createError(400, "Edit error: Bad format for '" + field + "'"))
      return
    }
  }

  let offer = offers.child(offerId)

  offer.once('value').then((snap) => {
    // Check that the offer exists
    if (snap.val() === null) {
      throw new Error('Offer does not exist')
    }

    // Try and update the offer
    offer.update(edits, (err) => {
      if (err) {
        throw new Error('Error in writing update to offer.')
      } else {
        res.send('Offer update was successful.')
      }
    })
  }).catch((err) => {
    next(createError(500, 'Error in updating offer: ' + err.message))
  })
})

/* Initiate the purchase process for an offer */
router.post('/:offer_id/purchase', function (req, res, next) {
  let offerId = req.params.offer_id
  let offerRef = offers.child(offerId)
  let buyerUID = req.auth.uid

  offerRef.once('value').then((snap) => {
    // Check that the offer exists
    var offerInfo = snap.val()

    if (offerInfo === null) {
      throw new Error('Offer does not exist.')
    }

    if (offerInfo.isSold) {
      throw new Error('Offer has already been sold.')
    }

    // Lock the offer
    offerRef.transaction(function (offer) {
      if (offer.lockedTo !== '') {
        offer.lockedTo = buyerUID
        offer.isSold = true
      } else {
        return
      }
      return offer
    }, (error, committed, snapshot) => {
      if (error) {
        res.status(400)
        res.json(JSON.stringify({
          'success': false,
          'message': 'Could not lock offer.'
        }))
      }

      var offerUpdatedInfo = snapshot.val()

      res.json(JSON.stringify({
        'success': true,
        'pictures': offerUpdatedInfo.pictures,
        'price': offerUpdatedInfo.price,
        'name': offerUpdatedInfo.name,
        'offerId': offerUpdatedInfo.offerId
      }))
    })
  })
})

module.exports = router
