# Padl Server

## Commands

### Start server
```bash
DEBUG=server npm start
```



## User Accounts
```
Email: mattfeng4@mit.edu
Password: testing
```

## Resources Used

* Using Firebase to query data on demand (rather than real time): https://howtofirebase.com/save-and-query-firebase-data-ed73fb8c6e3a
  * `ref.once("value", (snap) => {})`
* Creating Firebase references: https://firebase.google.com/docs/database/admin/retrieve-data
  * `admin.database().ref()`
  * `admin.database().ref().child()`
* Firebase Real Time Messaging: https://www.raywenderlich.com/140836/firebase-tutorial-real-time-chat-2
* Handling different types of requests in Express.js: https://scotch.io/tutorials/build-a-restful-api-using-node-and-express-4
* Null vs. Undefined: https://codeburst.io/javascript-null-vs-undefined-20f955215a2

## API Reference

### Main Keys ("Tables")

#### Legend
- `*` Builtin
- `+` Editable via a single API call.

#### User
* Fields
  * `uid*`: The user ID. Handled by Firebase auth.
  * `email*+`: The email that the user uses to login. Handled by Firebase Auth.
  * `emailVerified*`: Handled by Firebase Auth.
  * `phoneNumber*`: The user's phone number. Unused.
  * `password*+`: The user's password.
  * `displayName*+`: The display name for the user.
  * `photoURL*`: Photo URL for the user. Unused. **Use `propic` instead**.
  * `propic+`: URL for the user's profile picture.
  * `isServiceAccount+`: Boolean for whether or not an account is a service account.
  * `ratings`: List of ratings for the user.
  * `school+`: The school that the user attends.
  * `location+`: Where the user is located, such as dorm or FSILG.
  * `offers`: List of offers the user has posted.
  * `wishes`: List of wishes the user has.
  * `dateJoined`: Date that the user joined Padl.

#### Offer
* Fields
  * `offerId`
  * `name`
  * `description`
  * `pictures`
  * `price`
  * `seller`
  * `location`
  * `isSold`
  * `dateAdded`

#### Rating
* Fields
  * `ratingId`
  * `score`
  * `author`
  * `recipient`
  * `title`
  * `comment`
  * `dateAdded`

#### Wish
* Fields
  * `wishId`
  * `dateAdded`

### Routes

#### `routes/newaccount.js`
* `/newaccount`
  * Type: `POST`
  * Body parameters:
    * `email` The user's email address that they want to use to access their account.
    * `password` The user's password that they want to use to authenticate.
    * `displayName` The user's name that they want other users to see.
    * `location` The location where the user lives.
  * Requires Authentication: `false`
  * Modifies database: `true`
  * Relevant database keys: `/users`
  * Creates a new user with the specified body parameters and stores the user in both Firebase Authentication

#### `routes/users.js`
* `/users`
  * Type: `GET`
  * Body parameters: None
  * Requires Authentication: `true`
  * Modifies database: `false`
  * Relevant database keys: `/users`
  * Gets user information for all users in the Firebase `users` dictionary.

* `/users/:user_id`
  * Type: `GET`
  * Body parameters: None
  * Requires Authentication: `true`
  * Modifies database: `false`
  * Relevant database keys: `/users/(user_id)`
  * Gets user information for *specific* user in the Firebase `users` dictionary, at `users/(user_id)`.

* `/users/:user_id/edit_profile`
  * Type: `POST`
  * Body parameters:
    * `edits`: A JSON string that contains the desired edits to be made. Valid fields in the JSON dictionary are
      * `email`
      * `password`
      * `displayName`
      * `propic`
      * `isServiceAccount`
      * `school`
      * `location`
  * Requires Authentication: `true`
  * Modifies database: `true`
  * Relevant database keys: `/users/(user_id)`
  * Updates the various attributes of a user in the Firebase `users` dictionary, at `users/(user_id)`

#### `routes/offers.js`
* `/offers`
  * Type: `GET`
  * Body parameters: None

* `/offers/:offer_id`
  * Type: `GET`
  * Body parameters: None

* `/offers/new`
  * Type: `POST`
  * Body parameters:
    * `name`: The name of the offer.
    * `description`: The description of the offer.
    * `price`: The price of the offer. Can accept any valid format of pricing, as well as `Price Negotiable`.
    * `location`: The location the offer can be found.
  * Requires Authentication: `true`
  * Modifies database: `true`
  * Relevant database keys: `/offers/`
  * Creates a new offer.
    * `200`

* `/offers/:offer_id/edit`
  * Type: `POST`
  * Body parameters:
    * `edits`: A JSON dictionary encoded as a string with all the edits that would like to make.
      * `name` The new name to use.
      * `description` The new description to use.
      * `price` The new price to use.
      * `location` The new location to use.
  * Requires Authentication: ``
  * Modifies database: `true`
  * Relevant database keys: `/offers/(offer_id)`
  * Changes the entries for the relevant offer.
  * Returns:
    * `200`

#### `routes/newaccount.js`
* `/newaccount`
  * Type: `POST`
  * Body parameters:
    * `email`
    * `password`
    * `displayName`
    * `location`
  * Requires Authentication: `false`
  * Modifies database: `true`
  * Relevant database keys: `/users`, `Firebase Auth`
  * Creates a new user account.
  * Returns:
    * `200`


## Implementation Details

### Creating an account (Client Side)
* Make a call to the server API to create an account
* Then automatically call the sign in function on the client side

### Signing In (Client Side)
* `firebase.auth().signIn(withEmail email: String, password: String, completion:)`
  * Afterward, check if the user has emailVerified; if not -- send an email verification and don't continue

### Uploading Images
* Send a POST request to `/amazons3/upload` with body parameter `img` (encoded as `form-data`). Returns a

## Payments

### Payment System

#### Platform
Stripe

#### Actors
* Buyer<sup>E</sup>
* Padl<sup>P</sup>
* Padl<sup>S</sup>
* Seller<sup>E</sup>

where `E — Express account`, `P — Platform account`, `S — Standard account`

#### Charges

##### Buying Stage
Buyer → Via Destination Charge → Padl<sup>S</sup>

##### Payout Stage
Padl<sup>S</sup> → Via Destination Charge → Seller<sup>E</sup>

Refund Stage:
Padl<sup>S</sup> → Via Refund → Buyer<sup>E</sup>

#### Purchase Steps
1. Buyer clicks Purchase Item
2. Mobile App sends a `POST` request to `/offers/:offer_id/purchase`
    - This call locks the offer to the buyer and provide the mobile app with the details of the payment: `price`, `name` (of the offer), `user_id(S)` (in the form of their name).
    - From `offer_id`, get the seller’s `user_id(S)` and the offer’s `price` and `name`.
3. The `POST` request returns a JSON document with the details of the purchase to be made, which is then parsed by the Mobile App and converted into a secure collect payment information page.
    - This page will generate a `source` token
4. Mobile App sends a `POST` request to `/offers/:offer_id/charge`
    - Check that the
    - The server will create a **Destination Charge** with the `source` (a token) provided by the client and destination as the seller's `account_id`.
5. Finally, Firebase cloud function that checks when both parties have committed to the transfer in the offer (`seller_contract` and `buyer_contract`), automatically transfer from the Padl platform account to the seller.

#### Create a transfer
```bash
curl https://api.stripe.com/v1/transfers \
   -u sk_test_dVPp3WC9E2ShH9v4lcx1KgYT: \
   -d amount=800 \
   -d currency=usd \
   -d destination="acct_1ChHh9GWAhkJbY28"
```

#### Create a charge
```bash
curl https://api.stripe.com/v1/charges \
   -u sk_test_dVPp3WC9E2ShH9v4lcx1KgYT: \
   -d amount=999 \
   -d currency=usd \
   -d description="Example charge" \
   -d source=tok_bypassPending
```