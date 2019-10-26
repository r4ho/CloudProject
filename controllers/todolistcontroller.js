
'use strict';


var mongoose = require('mongoose'),
  Expense = mongoose.model('Expenses'),
  limit = mongoose.model('ExpenseLimit'),
  ExpenseImage = mongoose.model('ExpenseImage');

var multiparty = require('multiparty');

  var aws = require('aws-sdk')
var express = require('express')
var multer = require('multer')
var multerS3 = require('multer-s3')
var s3bucket = new aws.S3({ 
  accessKeyId: '',
  secretAccessKey: '',
  Bucket: 'raymondho.net'
})

const AmazonCognitoIdentity = require('amazon-cognito-identity-js');
const CognitoUserPool = AmazonCognitoIdentity.CognitoUserPool;
const request = require('request');
const jwkToPem = require('jwk-to-pem');
const jwt = require('jsonwebtoken');
global.fetch = require('node-fetch');

const poolData = {    
    UserPoolId : "", // Your user pool id here    
    ClientId : "" // Your client id here
    }; 
    const pool_region = 'us-west-2';

const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);


var upload = multer({
  storage: multerS3({
    s3: s3bucket,
    bucket: 'raymondho.net',
    metadata: function (req, file, cb) {
      cb(null, {fieldName: file.fieldname});
    },
    key: function (req, file, cb) {
      cb(null, Date.now().toString())
    }
  })
})

var mysql = require('mysql');
var connection = mysql.createConnection({
host: '',
user: '',
password: '',
port: '',
timeout: 60000
});
connection.connect(function(err) {
  if(err) {
    console.log('Database connection failed' + err.stack);
    return;
  }
  connection.query('CREATE TABLE IF NOT EXISTS images (' +
  'file_name VARCHAR(255), first_name VARCHAR(255), last_name VARCHAR(255),' + 
  'upload_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,' +
  'update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP, description VARCHAR(255)' +
  ')')
  connection.query('INSERT INTO images(file_name, first_name, last_name, description) VALUES(hello, first, last, desc');
  connection.query('SELECT * FROM images', (err, rows)=> {
    if(err) throw err;
    console.log("WORKED");
    console.log(rows);
  })
  console.log('Connected to database.');
})

exports.checkuser = function(req, res) {
  var data = { UserPoolId : '',
  ClientId : ''
};
var userPool = new AmazonCognitoIdentity.CognitoUserPool(data);
var cognitoUser = userPool.getCurrentUser();

if (cognitoUser != null) {
  cognitoUser.getSession(function(err, session) {
      if (err) {
          alert(err);
          return;
      }
      console.log('session validity: ' + session.isValid());
      return true;
  });
}
else {
  return false;
}
}

exports.register = function (req, res) {
  var name = req.body.name;
  var email = req.body.email;
  var password = req.body.password;
  var attributeList = [];
  
  attributeList.push(new AmazonCognitoIdentity.CognitoUserAttribute({ Name: "email", Value: email }));
  attributeList.push(new AmazonCognitoIdentity.CognitoUserAttribute({Name:"name",Value:name}));
  userPool.signUp(email, password, attributeList, null, function (err, result) {
    if (err)
        res.json(err);
    var cognitoUser = result.user;
    res.json(cognitoUser);
  })
}

exports.login = function (body, callback) {
  var userName = body.name;
  var password = body.password;
  var authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails({
       Username: userName,
       Password: password
   });
   var userData = {
       Username: userName,
       Pool: userPool
   }
   var cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
   cognitoUser.authenticateUser(authenticationDetails, {
       onSuccess: function (result) {
          var accesstoken = result.getAccessToken().getJwtToken();
          callback(null, accesstoken);
       },
       onFailure: (function (err) {
          callback(err);
      })
  })
};


exports.addImage = function(req, res) {
    res.json(req.file);
};

exports.updateImage = function(req, res) {
  console.log(req);
  var key = req.params.updateid;
  var deletes = s3bucket.deleteObject({Bucket:'raymondho.net', Key: key}, function(err, data) {
    if(err) console.log(err)
  });
  var upload = multer({
    storage: multerS3({
      s3: s3bucket,
      bucket: 'raymondho.net',
      metadata: function (req, file, cb) {
        cb(null, {fieldName: file.fieldname});
      },
      key: function (req, file, cb) {
        cb(null, key)
      }
    })
  })
  console.log(upload.single('file'))
  res.json(req.file);
}

exports.showhome = async function(req,res) {
  aws.config.setPromisesDependency();
   const image = await s3bucket.listObjectsV2({Bucket:'raymondho.net'}).promise();
   var array = [];
  for(var a = 0; a < image['Contents'].length; a++) {
    array.push(""+image['Contents'][a]['Key']);
  }
    res.render('index',{data: array});
}

exports.showcreate = function(req,res) {
  res.render('createimage');
}

exports.showdelete = function(req, res) {
  res.render('deleteimage');
}

exports.showupdate = function(req, res) {
  res.render('updateimage')
}

exports.showregister = function(req, res) {
  res.render('registerpage')
}

exports.chooseupdate =  async function(req, res) {
  aws.config.setPromisesDependency();
   const image = await s3bucket.listObjectsV2({Bucket:'raymondho.net'}).promise();
   var array = [];
  for(var a = 0; a < image['Contents'].length; a++) {
    array.push(""+image['Contents'][a]['Key']);
  }
    res.render('chooseupdate',{data: array});
}

exports.startupdate = function(req, res) {
  res.render('updateimage', req.params);
}

exports.getImages = async function(req, res) {
  aws.config.setPromisesDependency();
   const image = await s3bucket.listObjectsV2({Bucket:'raymondho.net'}).promise();
   var array = [];
  for(var a = 0; a < image['Contents'].length; a++) {
    array.push(""+image['Contents'][a]['Key']);
  }
   res.json(array);
};

exports.deleteImage = function(req, res) {
var key = req.body.deleteid;
console.log(key);
var deletes = s3bucket.deleteObject({Bucket:'raymondho.net', Key: key}, function(err, data) {
  if(err) console.log(err)
  res.json("Deleted");
});

};
