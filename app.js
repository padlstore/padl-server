var createError = require('http-errors')
var express = require('express')
var path = require('path')
var cookieParser = require('cookie-parser')
var logger = require('morgan')
var fileUpload = require('express-fileupload')

var newAccountRouter = require('./routes/newaccount')
var indexRouter = require('./routes/index')
var usersRouter = require('./routes/users')
var offersRouter = require('./routes/offers')
var amazons3Router = require('./routes/amazons3')
var stripeRouter = require('./routes/stripe')

var app = express()
var admin = require('./routes/auth')

require('./transfers')

// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

app.use(logger('dev'))
app.use(express.json()) // this is the body parser
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')))
app.use(fileUpload({ // allow for file uploads
  limits: { filesize: 5 * 1024 * 1024 }
}))

app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')

  if (req.method === 'OPTIONS') {
    res.sendStatus(200)
  } else {
    next()
  }
})

/* Routes that DO NOT require authentication */
app.use('/newaccount', newAccountRouter)

/* Authentication middleware */
app.use(function (req, res, next) {
  let token = (req.body.userToken == null) ? '' : req.body.userToken
  console.log('Auth token proposed:', token)

  admin.auth().verifyIdToken(token).then((decoded) => {
    req.auth = {
      'userToken': decoded,
      'uid': decoded.uid
    }
    console.log(`Auth success: ${decoded.uid}`)
    next()
  }).catch((_) => {
    console.log('Auth failed.')
    if (req.app.get('env') === 'development') {
      req.auth = {
        'userToken': 'DEVELOPMENT',
        'uid': 'gGqipoI2lqQZBUHQfMZMEuL5Muh1'
        // padl-test-account1@mit.edu 4bQi9p22VDaTFoR0ZnKSI7Oo8ie2
        // test@mit.edu gGqipoI2lqQZBUHQfMZMEuL5Muh1
      }
      next()
    } else {
      next(createError(403, 'Permission denied.'))
    }
  })
})

/* Routes that require authentication */
app.use('/', indexRouter)
app.use('/users', usersRouter)
app.use('/offers', offersRouter)
app.use('/amazons3', amazons3Router)
app.use('/stripe', stripeRouter)

/* Catch 404s and forward to error handler */
app.use(function (req, res, next) {
  next(createError(404))
})

/* Error handler */
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message
  res.locals.error = req.app.get('env') === 'development' ? err : {}

  // render the error page
  res.status(err.status || 500)
  res.render('error')
})

module.exports = app
