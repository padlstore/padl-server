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

var stripeConfig = require('../secrets/stripe_config')
var stripe = require('stripe')(stripeConfig.secretKey)

var db = admin.database()
var offers = db.ref('offers')
var users = db.ref('users')
var transactions = db.ref('transactions')

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
  let dateSold = -1
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
    'price': Number(price),
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

  // Lock the offer
  let offer
  offerRef.once('value').then((snap) => {
    offer = snap.val()
    if (offer === null) {
      throw new Error('Offer does not exist.')
    }

    if (offer.sold) {
      throw new Error('Offer has already been sold.')
    }

    if (offer.lockedTo !== '') {
      throw new Error('Offer has already been locked to another user.')
    }
  }).catch((err) => {
    next(createError(500, 'Error in locking offer: ' + err.message))
  }).then(() => {
    let updates = {
      'lockedTo': buyerUID
    }

    offerRef.update(updates).then(() => {
      res.json(JSON.stringify({
        'success': true,
        'pictures': offer.pictures,
        'price': offer.price,
        'name': offer.name,
        'offerId': offer.offerId
      }))
    }).catch((err) => {
      next(createError(500, 'Could not update lock on offer: ' + err.message))
    })
  })
})

router.post('/:offer_id/charge', function (req, res, next) {
  let buyerUID = req.auth.uid
  let source = req.body.source
  let offerId = req.params.offer_id

  let offerRef = offers.child(offerId)

  if (source === undefined || source === null || source === '') {
    next(createError(400, 'Source token was not provided.'))
    return
  }

  offerRef.once('value').then((snap) => {
    let offer = snap.val()

    if (offer === null) {
      throw new Error('Offer does not exist')
    }

    if (offer.lockedTo !== buyerUID) {
      throw new Error('Offer is not locked to you.')
    }

    if (offer.sold) {
      throw new Error('Offer has already been charged.')
    }

    let chargeDescription = 'Charge for purchasing: ' +
                             offer.name + ' with id ' +
                             offer.offerId
    let chargeAmount = offer.price
    // console.log(offer)
    // console.log(chargeAmount)

    // FOR TESTING ONLY:
    source = 'tok_visa'

    const charge = stripe.charges.create({
      amount: chargeAmount,
      currency: 'usd',
      description: chargeDescription,
      source: source
    }).catch((err) => {
      next(createError(500, 'Charge error: ' + err.message))
    })

    let transactionTime = Date.now()

    const logTransaction = transactions.child(offerId).set({
      'dateTime': transactionTime
    }).catch((err) => {
      console.log('Could not push new transaction for offer_id=' +
                  offerId + ': ' + err.message)
    })

    const setSold = offerRef.update({
      'sold': true,
      'dateSold': transactionTime
    }).catch((err) => {
      console.log('Unable to change to offer to sold state: ' + err.message)
    })

    Promise.all([logTransaction, charge, setSold]).then((_, success, __) => {
      res.json(JSON.stringify({
        'success': true,
        'message': 'Payment was processed successfully.'
      }))
    })
  }).catch((err) => {
    next(createError(500, err.message))
  })
})

module.exports = router
