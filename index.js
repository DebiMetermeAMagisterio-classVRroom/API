const http = require('http');
require('dotenv').config();
const express = require('express');
const bodyParser = require("body-parser");
const app = express()
const { MongoClient, ServerApiVersion } = require('mongodb');


const newLocal = 3001;
const PORT = process.env.PORT || newLocal;

const uri = process.env.DB_URI;
client= null;
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
var database, collection;


app.get('/api/get_courses', function (req, res) {
  collection.find().toArray((error, result) => {
    if(error) {
        res.send("Error")
    }
    res.json({
      message: "OK",
      response: result
    })
});
});

app.get('/api/login/:name/:password', function (req, res){
  var username = req.params.name;
  var password = req.params.password;
  collection = database.collection("users");
  collection.findOne({"first_name": username,"password":password}, (error,result)=>{
    if(error) {
      res.send("Error")
    }
    res.json({
      message: "OK",
      response: result
    })
  });
});

app.listen(PORT, () => {
  MongoClient.connect(uri, { useNewUrlParser: true, serverApi: ServerApiVersion.v1  }, (error, client) => {
    if(error) {
        throw error;
    }
    database = client.db(process.env.DB_NAME);
    collection = database.collection("courses");
    console.log("Connected to database" + "!");
  });
});