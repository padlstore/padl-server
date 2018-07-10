/*
 * newaccount.js
 * -------------
 * Handles the creation of new accounts.
 *
 */

var express = require('express')
var router = express.Router()

var admin = require('./auth')
var utils = require('./utils')

var db = admin.database()
var users = db.ref('users')

var stripeConfig = require('../secrets/stripe_config')
var stripe = require('stripe')(stripeConfig.secretKey)

/* POST request to create a new account. */
router.post('/', async (req, res, next) => {
  let email = req.body.email
  let emailVerified = false
  let disabled = false
  let password = req.body.password
  let displayName = req.body.displayName
  let propic = 'https://s3.amazonaws.com/padl.storage1/profile_pictures/default.jpg'
  let isServiceAccount = false
  let ratings = {'sentinel': ''}
  let school = 'MIT'
  let location = req.body.location
  let offers = {'sentinel': ''}
  let purchases = {'sentinel': ''}
  let wishes = {'sentinel': ''}

  // Check that all the proposed edits are "good", i.e. non empty and formatted correctly
  var valid = (utils.isValidEmail(email) &&
           utils.isValidPassword(password) &&
           utils.isValidDisplayName(displayName) &&
           utils.isValidLocation(location))

  if (!valid) {
    res.status(400)
    res.json({
      'success': false,
      'message': 'Invalid input provided.'
    })
  }

  // Create the user settings that are passed into Firebase Auth (createUser)
  // Firebase Database (set)
  let userSettingsFirebaseAuth = {
    email: email,
    emailVerified: emailVerified,
    password: password,
    disabled: disabled,
    displayName: displayName
  }

  let customer

  try {
    customer = await new Promise((resolve, reject) => {
      stripe.customers.create({
        description: `Customer for ${email}`,
        email: email
      }, (err, cust) => {
        if (err) {
          reject(err)
        } else {
          resolve(cust)
        }
      })
    })
  } catch (error) {
    res.status(500)
    res.json({
      success: false,
      message: `Couldn't create stripe account: ${error.message}`
    })
    res.end()
  }

  let userSettingsFirebaseDB = {
    email: email,
    isServiceAccount: isServiceAccount,
    propic: propic,
    location: location,
    school: school,
    offers: offers,
    ratings: ratings,
    wishes: wishes,
    customerId: customer.id,
    purchases: purchases
  }

  admin.auth().createUser(userSettingsFirebaseAuth).then((userRecord) => {
    let user = users.child(userRecord.uid)
    user.set(userSettingsFirebaseDB, (err) => {
      if (err) { // if an error actually occured
        res.status(500)
        res.json({
          success: false,
          message: "Couldn't create new account in Firebase DB"
        })
      } else {
        console.log('Creating new account with email: ' + email)
        res.status(200)
        res.json({
          success: true
        })
      }
    })
  }).catch((err) => {
    res.status(500)
    res.json({
      success: false,
      message: "Couldn't create new account in Firebase Auth: " + err.message
    })
    res.end()
  })
})

module.exports = router
