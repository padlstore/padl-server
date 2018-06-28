var admin = require('./routes/auth')
var stripeConfig = require('./secrets/stripe_config')
var stripe = require('stripe')(stripeConfig.secretKey)

var db = admin.database()
var offers = db.ref('offers')
var users = db.ref('users')

offers.on('child_changed', (snap) => {
  var change = snap.val()

  if (change === null) {
    return
  }

  if (change.buyerSigned && change.sellerSigned &&
    !change.performedTransfer) {
    let sellerRef = users.child(change.seller)

    sellerRef.once('value', (snap_) => {
      let seller = snap_.val()

      if (seller === undefined || seller === null) {
        console.log('Seller is null!')
        return
      }

      stripe.transfers.create({
        'amount': change.price,
        'currency': 'usd',
        'source_transaction': change.chargeId,
        'destination': seller.stripeAccountId
      }).then((transfer) => {
        return offers.child(change.offerId).update({
          'transferId': transfer.id,
          'performedTransfer': true
        })
      }).catch((err) => {
        console.log('Transfer failed: ' + err.message)
      })
    })
  }
})
