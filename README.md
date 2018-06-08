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
