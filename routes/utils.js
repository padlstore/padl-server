var isString = function(obj) {
  return (Object.prototype.toString.call(obj) === '[object String]');
}

var isBoolean = function(obj) {
  return obj === true || obj === false;
}

var isMinLengthString = function(str, len) {
  return isString(str) && str.length >= len;
}

var isValidEmail = function(email) {
  let re = /[^\s@]+@[^\s@]+\.[^\s@]+/;
  return isString(email) && re.test(email);
}

var isValidPassword = function(password) {
  return isMinLengthString(password, 9);
}

var isValidLocation = function(loc) {
  // TODO: Replace hard coded locations with something more flexible
  // TODO: Add locations based on school
  let validLocations = ['Simmons Hall', 'Maseeh Hall',
                        'McCormick Hall', 'Burton Conner',
                        'Random Hall', 'Next House',
                        'New House', 'Martin Trust Center'];
  return utils.isString(loc) && validLocations.includes(loc);
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

var isValidPrice = function(price) {
  let re = /^\$?\-?([1-9]{1}[0-9]{0,2}(\,\d{3})*(\.\d{0,2})?|[1-9]{1}\d{0,}(\.\d{0,2})?|0(\.\d{0,2})?|(\.\d{1,2}))$|^\-?\$?([1-9]{1}\d{0,2}(\,\d{3})*(\.\d{0,2})?|[1-9]{1}\d{0,}(\.\d{0,2})?|0(\.\d{0,2})?|(\.\d{1,2}))$|^\(\$?([1-9]{1}\d{0,2}(\,\d{3})*(\.\d{0,2})?|[1-9]{1}\d{0,}(\.\d{0,2})?|0(\.\d{0,2})?|(\.\d{1,2}))\)$/

  return isString(price) && (price == "Price Negotiable" || re.test(price));
}

functions = {
  "isString":                isString,
  "isBoolean":               isBoolean,
  "isValidEmail":            isValidEmail,
  "isValidPassword":         isValidPassword,
  "isValidLocation":         isValidLocation,
  "isValidDisplayName":      isValidDisplayName,
  "isValidOfferName":        isValidOfferName,
  "isValidOfferDescription": isValidOfferDescription,
  "isValidPrice":            isValidPrice,
}

module.exports = functions;
