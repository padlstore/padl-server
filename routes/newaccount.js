var createError = require('http-errors');
var express = require('express');
var router = express.Router();

var admin = require('./auth')

var db = admin.database()
var users = db.ref('users')

/* POST request to create a new account. */
router.get('/', function(req, res, next) {
  res.send('Creating account')
});

module.exports = router;
