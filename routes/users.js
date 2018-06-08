var express = require('express');
var router = express.Router();

var admin = require('./auth')

var db = admin.database()
var root = admin.database().ref()
var test = admin.database().ref('testing')

/* GET users listing. */
router.get('/all', function(req, res, next) {

  test.once('value').then((snap) => {
    res.send(snap.val());
  }).catch((err) => {
    console.log(err);
  })

});

module.exports = router;
