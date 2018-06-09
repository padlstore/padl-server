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

## API Reference

### Main Keys ("Tables")
#### User
* Fields
  * `email*`: The email that the user uses to login. Handled by Firebase Auth.
  * `emailVerified*`: Handled by Firebase Auth.
  * `phoneNumber*`: The user's phone number. Unused.
  * `password*`: The user's password.
  * `displayName*`: The display name for the user.
  * `photoURL*`: Photo URL for the user. Unused. **Use `propic` instead**.
  * `propic`: URL for the user's profile picture.
  * `isServiceAccount`: Boolean for whether or not an account is a service account.
  * `ratings`: List of ratings for the user.
  * `school`: The school that the user attends.
  * `location`: Where the user is located, such as dorm or FSILG.
  * `offers`: List of offers the user has posted.
  * `wishlist`: List of wishes the user has.

#### Offer
* Fields
  * `name`
  * `description`
  * `pictures`
  * `price`
  * `itemId`
  * `seller`
  * `location`
  * `isSold`

### Rating
* Fields
  * `score`
  * `author`
  * `recipient`
  * `title`
  * `comment`

### Wish
* Fields

### Routes

#### `routes/newaccount.js`
* `/newaccount`
  * Type: `POST`
  * Body parameters:
    * `email` The user's email address that they want to use to access their account.
    * `password` The user's password that they want to use to authenticate.
    * `displayName` The user's name that they want other users to see.
  * Requires Authentication: `false`
  * Modifies database: `true`
  * Relevant database keys: `/users`
  * Creates a new user with the specified body parameters and stores the user in both Firebase Authentication


#### `routes/users.js`
* `/users`
  * Type: `GET`
  * Requires Authentication: `true`
  * Modifies database: `false`
  * Relevant database keys: `/users`
  * Gets user information for all users in the Firebase `users` dictionary.

* `/users/:user_id`
  * Type: `GET`
  * Requires Authentication: `true`
  * Modifies database: `false`
  * Relevant database keys: `/users/(user_id)`
  * Gets user information for *specific* user in the Firebase `users` dictionary, at `users/(user_id)`.

* `/users/:user_id/edit_profile_picture`
  * Type: `POST`
  * Requires Authentication: `true`
  * Modifies database: `true`
  * Relevant database keys: `/users/(user_id)/propic`
  * Updates the `propic` attribute of a user in the Firebase `users` dictionary, at `users/(user_id)`

#### `routes/offers.js`
