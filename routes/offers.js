/*
 *  offers.js
 *  ---------
 *  Handles all routes regarding viewing, creating, and modifying offers.
 */

var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('offers', { title: 'Offers' });
});

module.exports = router;
