var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var newAccountRouter = require('./routes/newaccount');
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var offersRouter = require('./routes/offers');

var app = express();
var admin = require('./routes/auth')

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json()); // this is the body parser
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


/* Routes that DO NOT require authentication */
app.use('/newaccount', newAccountRouter);




/* Authentication middleware */
app.use(function(req, res, next) {
  let token = req.body.token == null? "" : req.body.token;

  admin.auth().verifyIdToken(token).then((decoded) => {
    next();
  }).catch((err) => {
    if (req.app.get('env') === 'development') {
      next();
    } else {
      next(createError(403, "Permission denied"));
    }
  });
});

/* Routes that require authentication */
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/offers', offersRouter)





/* Catch 404s and forward to error handler */
app.use(function(req, res, next) {
  next(createError(404));
});

/* Error handler */
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
