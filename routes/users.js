var createError = require('http-errors');
var express = require('express');
var router = express.Router();

var admin = require('./auth')

var db = admin.database()
var users = db.ref('users')

/*
 ********************
 *** GET requests ***
 ********************
 */

/* GET request for all users */
router.get('/', function(req, res, next) {
  users.once('value').then((snap) => {
    if (snap.val() === null)
      throw new Error("'Users' missing in database");

    res.send(snap.val());
  }).catch((err) => {
    console.log(err);
    next(createError(500, "Couldn't get all users: " + err.message));
  });
});

/* GET request for a specific user */
router.get('/:user_id', function(req, res, next) {
  let user_id = req.params.user_id;
  let user = users.child(user_id);

  user.once('value').then((snap) => {
    if (snap.val() === null)
      throw new Error("User '" + user_id + "'  missing in database");

    res.send(snap.val());
  }).catch((err) => {
    console.log(err);
    next(createError(500, "Couldn't get user info: " + err.message));
  });
});


/*
 ********************
 *** PUT requests ***
 ********************
 */

/* PUT request to edit a user's profile picture */





module.exports = router;
