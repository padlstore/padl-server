var express = require('express');
var router = express.Router();

var admin = require('./auth')

var db = admin.database()
var users = db.ref("users")

/* GET users listing. */
router.get('/all', function(req, res, next) {

  // TODO: make sure the user requesting info is authenticated

  users.once('value').then((snap) => {
    res.send(snap.val());
  }).catch((err) => {
    console.log(err);
  });

});

router.get('/create', function(req, res, next) {
  res.send('user created');
});

module.exports = router;
