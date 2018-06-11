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
