const http = require('http');
const crypto = require('crypto');
require('dotenv').config();
const express = require('express');
const bodyParser = require("body-parser");
const app = express()
const { MongoClient, ServerApiVersion } = require('mongodb');
var ObjectId = require('mongodb').ObjectId; 


const newLocal = 3001;
const PORT = process.env.PORT || newLocal;

const uri = process.env.DB_URI;
client= null;
app.use(bodyParser.json());

var database, collection;

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.header('Allow', 'GET, POST, OPTIONS, PUT, DELETE');
  next();
});

app.get('/api/login', function (req, res){
  var username = req.query.username;
  var password = req.query.password;
  collection = database.collection("users");
  collection.findOne({"first_name":username,"password":password}, (error,result)=>{
    if(error){
      res.json({
        status: "ERROR",
        message: "Authentication failed",
        session_token : ""
      })
    }
    if(result) {
      var randNum = Math.floor(Math.random() * (1000 - 1 + 1) + 1);
      var tokenToHash = username+password+randNum;
      var token = crypto.createHash('sha256').update(tokenToHash).digest('hex');
      res.json({
        status: "OK",
        message: "Correct login, token created",
        session_token : token
      })
      const currentDate = new Date();
      const newDate = new Date(currentDate.getTime()+process.env.TOKEN_EXPIRATION_TIME)
      console.log(process.env.TOKEN_EXPIRATION_TIME / 600)
      collection.updateOne({"first_name":username,"password":password},
      { $set:{"session_token":token,"session_token_expiration":newDate}},function(err,res){
        if(err) throw err;
      })
    }else{
      res.json({
        status: "ERROR",
        message: "Authentication failed",
        session_token : ""
      })
    }
  });
});

app.get('/api/logout', function (req, res){
  var token = req.query.token;
  collection = database.collection("users");
  collection.findOne({"session_token":token}, (error,result)=>{
    if(error){
      res.json({
        status: "ERROR",
        message: "Session Token rquired"
      })
    }
    if(result){
      if(token == undefined || token == ""){
        res.json({
          status: "ERROR",
          message: "Session Token rquired"
        })
        }
        else{
          res.json({
            status: "OK",
            message: "Session succsesfully closed"
          })
      }
    }
    else{
        res.json({
          status: "ERROR",
          message: "Session Token rquired"
        })
    }
  });

});

app.get('/api/get_courses', function (req, res) {
  var token = req.query.token;
  collection = database.collection("users");
  collection.findOne({"session_token":token}, (error,result)=>{
    if(error) {
      res.json({
        status: "Error",
        message: "session_token is required"
      })
    }
    if(result){
      if(token=="" || token == undefined){
        res.json({
          status: "Error",
          message: "session_token is required"
        })
      }else{
        var user = result;
        collection = database.collection("courses");
        collection.find().toArray((error, result) => {
          if(error) {
            res.json({
              status: "Error",
              message: "session_token is required"
            })
          }
          if(result){
            var userCourses=[];
            result.forEach(element => {
              if(element.subscribers["students"].includes(user.id)){
                userCourses.push(element)
              }
            });
            res.json({
              status: "OK",
              message: "Returning student courses",
              course_list: userCourses
            })

          }else{
            res.json({
              status: "Error",
              message: "session_token is required"
            })
          }
        });
      }      
    }
    else{
      res.json({
        status: "Error",
        message: "session_token is required"
      })
    }
  });
});

app.get('/api/get_course_details', function (req, res) {
  var token = req.query.token;
  var courseID = req.query.courseID;
  var user;
  var courseDetails;
  if(token=="" || token == undefined){
    res.json({
      status: "Error",
      message: "session_token is required"
    })
  }
  if(courseID == "" || courseID == undefined){
    res.json({
      status: "Error",
      message: "Course ID is required"
    })
  }
  collection = database.collection("users");
  collection.findOne({"session_token":token}, (error,result)=>{
    if(error) {
      res.json({
        status: "Error",
        message: "session_token is required"
      })
    }
    if(result){
      user= result;
      collection = database.collection("courses");
      collection.findOne({"_id":ObjectId(courseID)}, (error,result)=>{
      if(error) {
        res.json({
          status: "Error",
          message: "Course ID is required"
        })
      }
      if(result){
        courseDetails = result;
        if(courseDetails.subscribers["students"].includes(user.id)){
          res.json({
            status:"OK",
            message: "Showing course details",
            course: courseDetails
          })
        }else{
          res.json({
            status: "Error",
            message: "Student is not subscribed to this course"
          })
        }
      }
    });   
    }
    else{
      res.json({
        status: "Error",
        message: "session_token is require"
      })
    }
  });
});

app.get('/api/export_database', function (req, res){
  var username = req.query.username;
  var password = req.query.password;
  collection = database.collection("users");
  collection.findOne({"first_name":username,"password":password}, (error,result)=>{
    if(error){
      res.json({
        status: "ERROR",
        message: "Database error"
      })
    }
    if(result) {
      collection = database.collection("courses");
      collection.find().toArray((error, result) =>{
        if(error){
          res.json({
            status: "ERROR",
            message: "Database error"
          })
        }
        if(result){
          res.json({
            status: "OK",
            message: "Exporting database...",
            course_list: result
          })
        }else{
          res.json({
            status: "ERROR",
            message: "Database error"
          })
        }
      })
    }else{
      res.json({
        status: "ERROR",
        message: "Database error"
      })
    }
  });
});

app.get('/api/pin_request', function (req, res) {
  var token = req.query.token;
  var taskID = req.query.taskID;
  collection = database.collection("users");
  collection.findOne({"session_token":token}, (error,result)=>{
    if(error) {
      res.json({
        status: "Error",
        message: "session_token is required"
      })
    }
    if(result){
      if(token=="" || token == undefined){
        res.json({
          status: "Error",
          message: "session_token is required"
        })
      }else{
        collection = database.collection("courses");
        collection.findOne({"vr_tasks.ID":taskID}, (error,result)=>{
          if(error) {
            res.json({
              status: "Error",
              message: "taskID is required"
            })
          }
          if(result){
            var pin = Math.floor(Math.random() * (1000 - 1 + 1) + 1);
            res.json({
              status: "OK",
              message: "Returning PIN",
              PIN: pin
            })

          }else{
            console.log(newDate.toString());
            res.json({
              status: "Error",
              message: "taskID is required",
              result: result
            })
          }
        });
      }      
    }
    else{
      res.json({
        status: "Error",
        message: "session_token is required"
      })
    }
  });
});

app.listen(PORT, () => {
  MongoClient.connect(uri, { useNewUrlParser: true, serverApi: ServerApiVersion.v1  }, (error, client) => {
    if(error) {
        throw error;
    }
    database = client.db(process.env.DB_NAME);
    console.log("Connected to database" + "!");
  });
});