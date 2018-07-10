/*
 * stripe.js
 * ---------
 * Handles the generation of ephemeral keys for users.
 *
 */

var createError = require('http-errors')
var admin = require('./auth')
var db = admin.database()
var users = db.ref('users')
var utils = require('./utils')

var stripeConfig = require('../secrets/stripe_config')
var stripe = require('stripe')(stripeConfig.secretKey)

var rp = require('request-promise')

var express = require('express')
var router = express.Router()

// TODO: Test this function
router.post('/complete_oauth', async (req, res) => {
  const clientSecret = req.body.client_secret
  const authCode = req.body.code
  const userId = req.auth.uid
  const grantType = 'authorization_code'

  let stripeResp = await rp('https://connect.strip.com/oauth/token', {
    client_secret: clientSecret,
    code: authCode,
    grant_type: grantType
  })

  if (stripeResp.error) {
    console.log("Couldn't complete OAuth sequence:")
    console.log(`${stripeResp.error}: ${stripeResp.error_description}`)
    res.status(500)
    res.json({
      success: false
    })
    res.end()
  } else {
    try {
      await users.child(userId).update({
        'stripeAccountId': stripeResp.stripe_user_id
      })
    } catch (error) {
      res.status(500)
      res.json({
        success: false,
        message: "Couldn't add Stripe Account ID to database"
      })
      res.end()
    }
  }
})

router.post('/new_key', async (req, res, next) => {
  const userId = req.auth.uid
  const stripeVersion = req.query.api_version
  if (!stripeVersion) {
    res.status(400)
    res.json({
      success: false,
      message: 'No API Version specified.'
    })
    res.end()
    return
  }

  // Determine customer ID
  let userInfoSnapshot
  let userInfo

  try {
    userInfoSnapshot = await users.child(userId).once('value')
    userInfo = userInfoSnapshot.val()
  } catch (error) {
    console.log("Couldn't retrieve user info in stripe.js")
    res.status(500)
    res.json({
      success: false,
      message: 'User ID does not exist.'
    })
    res.end()
    return
  }

  // Generate ephemeral key
  stripe.ephemeralKeys.create(
    { customer: userInfo.customerId },
    { stripe_version: stripeVersion }
  ).then((key) => {
    res.status(200).json(key)
  }).catch((err) => {
    res.status(500)
    next(err)
  })
})

module.exports = router
