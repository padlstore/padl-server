/*
 * amazons3.js
 * -----------
 * Handle interactions with Amazon S3, including uploading photos.
 *
 */

var createError = require('http-errors');
var express = require('express');
var router = express.Router();
var admin = require('./auth');
var uuidv3 = require('uuid/v3');

router.post('/upload', function(req, res, next) {
  var img = req.files.img;
  console.log(img.name);
  console.log(img.mimetype);

  // TODO: only allow img mimetypes
  res.send(img.name);
});

module.exports = router;
