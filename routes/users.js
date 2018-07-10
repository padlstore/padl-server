/*
 * users.js
 * --------
 * Handles the viewing and modification of user profile data.
 * All the routes in this file require authentication, handled by middleware.
 *
 */

var createError = require('http-errors')
var express = require('express')
var router = express.Router()

var admin = require('./auth')

var db = admin.database()
var users = db.ref('users')

var utils = require('./utils')

/*
 ********************
 *** GET requests ***
 ********************
 */

/* GET request for all users */
router.get('/', function (req, res, next) {
  users.once('value').then((snap) => {
    // Verify that the 'users' dictionary exists
    if (snap.val() === null) {
      throw new Error("'Users' table/key missing in database")
    }

    // Send information about the user
    let usersInfo = snap.val()
    res.json(usersInfo)
  }).catch((err) => {
    next(createError(500, "Couldn't get all users: " + err.message))
  })
})

/* GET request for a specific user */
router.get('/:userId', function (req, res, next) {
  let uid = req.params.userId
  let user = users.child(uid)

  // Check that the user exists, both in Firebase Auth and Firebase DB
  var firebaseAuthPromise = admin.auth().getUser(uid)
  var firebaseDBPromise = user.once('value')

  Promise.all([firebaseAuthPromise, firebaseDBPromise]).then((values) => {
    let [record, snap] = values

    // Verify that the user exists in Firebase DB
    if (snap.val() === null) {
      throw new Error("User '" + uid + "'  missing in database")
    }

    // Augment and send information about the user
    let userInfo = snap.val()
    userInfo.displayName = record.displayName
    userInfo.emailVerified = record.emailVerified
    userInfo.disabled = record.disabled
    userInfo.uid = record.uid

    res.json(userInfo)
  }).catch((err) => {
    next(createError(500, "Couldn't get user info: " + err.message))
  })
})

/*
 *********************
 *** POST requests ***
 *********************
 */

/* POST request to edit a user's profile */
router.post('/:userId/edit_profile', function (req, res, next) {
  let uid = req.params.userId
  let user = users.child(uid)
  let edits = req.body.edits

  // Check that user supplied edits
  if (edits == null) {
    next(createError(400, 'Edits are null'))
  }

  // Convert edits to JSON
  try {
    edits = JSON.parse(edits)
  } catch (e) {
    next(createError(400, 'Malformed request: Edits not in JSON format'))
    return
  }

  const fields = [ // don't let users change their email
    'password',
    'displayName',
    'propic',
    'isServiceAccount',
    'school',
    'location'
  ]

  // Validate input
  var validFormat = function (key, value) {
    switch (key) {
      case 'password': return utils.isValidPassword(value)
      case 'displayName': return utils.isValidDisplayName(value)
      case 'propic': return utils.isString(value)
      case 'isServiceAccount': return utils.isBoolean(value)
      case 'school': return utils.isValidSchool(value)
      case 'location': return utils.isValidLocation(value)
      default: return false
    }
  }

  // Check that all the proposed edits are "good", i.e. non empty and formatted correctly
  for (const field of fields) {
    if (edits[field] !== undefined && !validFormat(field, edits[field])) {
      next(createError(400, "Edit error: Bad format for '" + field + "'"))
      return
    }
  }

  var firebaseAuthPromise = admin.auth().getUser(uid)
  var firebaseDBPromise = user.once('value')

  Promise.all([firebaseAuthPromise, firebaseDBPromise]).then((values) => {
    let [record, snap] = values

    // Verify that the user exists in Firebase DB
    if (snap.val() === null) {
      next(createError(500, "User '" + uid + "'  missing in database"))
      return
    }

    // Update on Firebase Auth
    admin.auth().updateUser(uid, edits).then((userRecord) => {
      console.log('Updated user info in Firebase Auth: ' + userRecord.toJSON())
    }).catch((err) => {
      next(createError(500, "Couldn't update user in Firebase Auth:" + err.message))
      // TODO: figure out how to stop code execution after this
    })

    // Update custom fields in Firebase Database
    user.update(edits, (err) => {
      if (err) {
        console.log(err)
        next(createError(500, "Couldn't update user info: " + err))
        // TODO: figure out how to stop code execution after this
      } else {
        console.log('Updated user info in Firebase Database.')
        res.send('User info updated successfully.')
      }
    })
  }).catch((err) => {
    next(createError(500, "User doesn't exist: " + err.message))
  })
})

module.exports = router
