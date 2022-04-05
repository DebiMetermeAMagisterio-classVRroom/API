const http = require('http');
const crypto = require('crypto');
require('dotenv').config();
const express = require('express');
const bodyParser = require("body-parser");
const app = express()
const { MongoClient, ServerApiVersion } = require('mongodb');
const { stringify } = require('querystring');
const { url } = require('inspector');
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
      const currentDate = new Date();
      var minutes = process.env.TOKEN_EXPIRATION_TIME / 60000;
      const newDate = new Date(currentDate.getTime()+minutes * 60000)
      newDate.setHours(newDate.getHours()+2);
      res.json({
        status: "OK",
        message: "Correct login, token created",
        session_token : token
      })
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

app.get('/api/pin_request', async function (req, res) {
  var token = req.query.token;
  var taskID = req.query.taskID;
  var user;
  var pin_exists = true;
  users = database.collection("users");
  courses = database.collection("courses")
  if(token=="" || token == undefined){
    res.json({
      status: "Error",
      message: "session_token is required"
    })
  }
  if(taskID=="" || taskID == undefined){
    res.json({
      status: "Error",
      message: "taskID is required"
    })
  }
  user = await users.findOne({"session_token":token}, (error,result)=>{
    if(error) {
      res.json({
        status: "Error",
        message: "session_token is required"
      })
    }
    else if(result){
      user = result;   
    }else{
      res.json({
        status: "Error",
        message: "session_token is required"
      })
    }
  });
  taskID = parseInt(taskID)
  var course = await courses.findOne({"vr_tasks.ID":taskID}, (error,result)=>{
    if(error) {
      res.json({
        status: "Error",
        message: "taskID is required"
      })
    }
    if(result){
      course = result;
      var pin = "";
      var vrExID;
      var vrExVersion;
      course.vr_tasks.forEach(element => {
        if(element.ID == taskID){
          vrExID = element.VRexID;
          vrExVersion = element.versionID;
        }
      });
      pins = user.pins;
      //pin = generatePIN();
      var pins = []
      if(user.pins){
        user.pins.forEach(element => {
          pins.push(element.pin)
        });
      }
      pin = checkPinExists(pins,pin_exists);
      console.log(pin)
      users.updateOne({"first_name":user.first_name,"password":user.password},
      { $push:{"pins":{"pin":pin,"vr_taskID":taskID,"vrExID":vrExID,"versionID":vrExVersion,"used":false}}},function(err,res){
        if(err) throw err;
      })      
      res.json({
        status: "OK",
        message: "Returning PIN",
        PIN: pin
      })

    }else{
      res.json({
        status: "Error",
        message: "taskID is required",
        resCourse: result
      })
    }
  }); 
});

function generatePIN(){
  var pin = "";
  for (let index = 0; index < 4; index++) {
    pin+= Math.floor(Math.random() * (9 - 1 + 1) + 0);
  }
  return pin;
}

function checkPinExists(array,enter){
  while(enter){
    pin = generatePIN();
    if(array.length != 0){
      if(!array.includes(pin)){
        enter = false;
      }
    }else{
      enter = false;
    }
  }
  return pin;
}

app.get('/api/start_vr_exercise', async function (req, res) {
  var pin = req.query.pin;
  var user;
  users = database.collection('users');
  courses = database.collection('courses');
  if(pin=="" || pin == undefined){
    res.json({
      status: "Error",
      message: "PIN is required"
    })
  }
  user = await users.findOne({"pins.pin":pin}, (error,result)=>{
    if(error) {
      res.json({
        status: "Error",
        message: "PIN is required"
      })
    }
    else if(result){
      user = result;
      var vrExID;      
      var vrExVersion;
      user.pins.forEach(element => {
        if(element.pin == pin){
          if(element.used == true){
            res.json({
              status: "Error",
              message: "PIN is already used"
            })
          }else{
            users.updateOne({"pins.pin":element.pin},
          { $set:{"pins.$.used":true}},function(err,res){
            if(err) throw err;
          }) 
          vrExID= element.vrExID;
          vrExVersion = element.versionID;
          }
        }
      });
      res.json({
        status: "OK",
        message: "Correct PIN",
        username: user.first_name + " "+user.last_name,
        VRexerciseID: vrExID,
        minExVersion: vrExVersion
      })  
    }else{
      res.json({
        status: "Error",
        message: "PIN is required"
      })
    }
  });
});

app.post('/api/finish_vr_exercise', async function (req, res) {
  try{
    var pin = req.query.pin;
    var autograde = JSON.parse(req.query.autograde);
    var VRexerciseID = parseInt(req.query.VRexerciseID);
    var exVersion = parseInt(req.query.exVersion);
    var user_data;
    var user;
    users = database.collection('users');
    courses = database.collection('courses');
    if(pin=="" || pin == undefined){
      res.json({
        status: "Error",
        message: "PIN user is required"
      })
    }
    if(autograde=={} || autograde == undefined){
      res.json({
        status: "Error",
        message: "autograde is required"
      })
    }
    if(VRexerciseID=="" || VRexerciseID == undefined){
      res.json({
        status: "Error",
        message: "VrExcerciseID is required"
      })
    }
    if(exVersion=="" || exVersion == undefined){
      res.json({
        status: "Error",
        message: "ExcerciseVersion is required"
      })
    }
    user = await users.findOne({"pins.pin":pin}, (error,result)=>{
      if(error) {
        res.json({
          status: "Error",
          message: "PIN is required"
        })
      }
      else if(result){
        user = result;
        user.pins.forEach(element => {
          if(element.pin == pin){
            user_data = element;
          }
        });
        course = courses.updateOne({"vr_tasks.VRexID":VRexerciseID,"vr_tasks.versionID":exVersion,"vr_tasks.ID":user_data.vr_taskID},
        { $push:{"vr_tasks.$[elem].completions":{"studentID":user.id,"autograde":autograde}}},{arrayFilters:[{"elem.ID":user_data.vr_taskID}]},(error,result)=>{
          if(error){

          }
          else if(result){
            course = result;
            res.json({
              status: "OK",
              message: "Exercise data successfully stored"
            })
          }else{

          }
        });
      }else{
        res.json({
          status: "Error",
          message: "uknown error"
        })
      }
    });
  }catch(error){
    console.log(error)
  }
  
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