var isString = function (obj) {
  return (Object.prototype.toString.call(obj) === '[object String]');
}

var isBoolean = function (obj) {
  return obj === true || obj === false;
}

var isMinLengthString = function (str, len) {
  return isString(str) && str.length >= len;
}

var isValidEmail = function (email) {
  let re = /[^\s@]+@[^\s@]+\.[^\s@]+/;
  return isString(email) && re.test(email);
}

var isValidPassword = function (password) {
  return isMinLengthString(password, 9);
}

var isValidLocation = function (loc) {
  // TODO: Replace hard coded locations with something more flexible
  // TODO: Add locations based on school
  let validLocations = ['Simmons Hall', 'Maseeh Hall',
                        'McCormick Hall', 'Burton Conner',
                        'Random Hall', 'Next House',
                        'New House', 'Martin Trust Center', 'Other']
  return isString(loc) && validLocations.includes(loc)
}

var isValidDisplayName = function(name) {
  return isMinLengthString(name, 4);
}

var isValidOfferName = function(name) {
  return isMinLengthString(name, 4);
}

var isValidOfferDescription = function(description) {
  return isMinLengthString(description, 0);
}

var isValidPrice = function (price) {
  try {
    price = Number(price)
    return true
  } catch (error) {
    return false
  }
}

functions = {
  "isString":                isString,
  "isBoolean":               isBoolean,
  "isMinLengthString":       isMinLengthString,
  "isValidEmail":            isValidEmail,
  "isValidPassword":         isValidPassword,
  "isValidLocation":         isValidLocation,
  "isValidDisplayName":      isValidDisplayName,
  "isValidOfferName":        isValidOfferName,
  "isValidOfferDescription": isValidOfferDescription,
  "isValidPrice":            isValidPrice,
}

module.exports = functions;
