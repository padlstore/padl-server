var createError = require('http-errors')
var uuidv1 = require('uuid/v1')
var express = require('express')
var router = express.Router()

var admin = require('./auth')

var db = admin.database()
var transactions = db.ref('transactions')

var stripeConfig = require('../secrets/stripe_config')
var stripe = require('stripe')(stripeConfig.config.secretKey)

router.post('/charge', function (req, res, next) {
  let buyerUID = req.auth.uid

})

module.exports = router