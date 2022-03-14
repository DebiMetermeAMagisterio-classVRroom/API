const http = require('http');
require('dotenv').config()

const express = require('express');
const bodyParser = require("body-parser");
const app = express()
require('dotenv').config

const { MongoClient, ServerApiVersion } = require('mongodb');

const uri = process.env.DATABASE_URL;
client= null;
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
var database, collection;


app.get('/api/get_courses', function (req, res) {
  collection = database.collection("users")
  collection.find().toArray((error, result) => {
    if(error) {
        res.status(500).send(error);
    }
    console.log(res.json(result))
});
});

const newLocal = 3001;
const PORT = process.env.PORT || newLocal;

app.listen(PORT, () => {
  MongoClient.connect(uri, { useNewUrlParser: true, serverApi: ServerApiVersion.v1  }, (error, client) => {
    if(error) {
        throw error;
    }
    database = client.db("vrclassroom");
    collection = database.collection("courses");
    console.log("Connected to vrclassroom" + "!");
  });
});