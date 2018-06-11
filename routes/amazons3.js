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
var uuidv1 = require('uuid/v1');
var s3_config = require('../secrets/s3_config');

// Configure Amazon S3
var AWS = require('aws-sdk');
AWS.config.loadFromPath("./secrets/s3_config.json");

var https = require('https');
var agent = new https.Agent({
  maxSockets: 25,
});
var s3 = new AWS.S3({
  apiVersion: '2006-03-01',
  region: 'us-east-2',
  httpOptions: {
    agent: agent,
  },
  params: {
    Bucket: s3_config.buckets.bucketName,
  }
});

/*
 **********************
 ***  POST requests  **
 **********************
 */

/* Upload a file to Amazon S3 Bucket */
router.post('/upload', function(req, res, next) {
  var img = req.files.img;

  var imgName = img.name;
  var imgMIMEtype = img.mimetype;
  var imgData = img.data;

  // Check: Only allow img mimetypes
  const allowedMIMEtypes = {
    "image/png": ".png",
    "image/jpeg": ".jpg"
  }

  if (!(imgMIMEtype in allowedMIMEtypes)) {
    next(createError(400, "Image is not a JPEG or PNG file."));
    return;
  }

  // Upload photo
  var imgKey = "profile_pictures/" + uuidv1() + allowedMIMEtypes[imgMIMEtype];

  console.log("Trying to upload: " + imgKey + " as type " + imgMIMEtype);

  s3.upload({
    Key: imgKey,
    Body: imgData,
    ACL: 'public-read',
    ContentType: imgMIMEtype,
  }, (err, data) => {
    if (err) {
      next(createError(500, "Could not upload photo."));
      console.log(err.message);
      console.log(err);
      return;
    }

    res.send(JSON.stringify(data));
  });
});

module.exports = router;
