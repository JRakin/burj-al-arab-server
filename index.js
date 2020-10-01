const express = require('express');
const MongoClient = require('mongodb').MongoClient;
const bodyParser = require('body-parser');
const admin = require('firebase-admin');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(bodyParser.json());

var serviceAccount = require('./configs/burj-al-arab-f16-firebase-adminsdk-wbe2k-0f77d95e79.json');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.tjjkp.mongodb.net/burjAlArab?retryWrites=true&w=majority`;

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIRE_DB,
});

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

client.connect((err) => {
  const collection = client.db('burjAlArab').collection('bookings');

  app.post('/addBooking', (req, res) => {
    const newBooking = req.body;
    collection.insertOne(newBooking).then((result) => {
      res.send(result.insertedCount > 0);
    });
    // console.log(newBooking);
  });

  app.get('/bookings', (req, res) => {
    const bearer = req.headers.authorization;
    if (bearer && bearer.startsWith('Bearer ')) {
      const idToken = bearer.split(' ')[1];
      admin
        .auth()
        .verifyIdToken(idToken)
        .then(function (decodedToken) {
          let tokenEmail = decodedToken.email;

          if (tokenEmail === req.query.email) {
            collection
              .find({ email: req.query.email })
              .toArray((err, documents) => {
                res.status(200).send(documents);
              });
          } else {
            res.status(401).send('Unauthorized access');
          }
        })
        .catch(function (error) {
          res.status(401).send('Unauthorized access');
        });
    } else {
      res.status(401).send('Unauthorized access');
    }
  });

  console.log('connected successfully');
});

app.listen(4000, () => {
  console.log('listening');
});
