
'use strict';



var multiparty = require('multiparty');
global.logged_in = "";
global.log_user_name = "";
global.admin = ""

var aws = require('aws-sdk');
var config = require('../config/config.js');
var isDev = process.env.NODE_ENV !== 'production';
var express = require('express')
var multer = require('multer')
var multerS3 = require('multer-s3')
var s3bucket = new aws.S3({ 
  accessKeyId: 'AKIA6G5SFHWXNGMW4APM',
  secretAccessKey: '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',
  Bucket: 'raymondho.net'
})

const AmazonCognitoIdentity = require('amazon-cognito-identity-js');
const CognitoUserPool = AmazonCognitoIdentity.CognitoUserPool;
const request = require('request');
const jwkToPem = require('jwk-to-pem');
const jwt = require('jsonwebtoken');
global.fetch = require('node-fetch');


const poolData = {  UserPoolId : "us-west-2_jZ4pJevzH",  
    ClientId : "5p2f3mg30g2gmefmsdh9k64mrs" 
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
/*var connection = mysql.createConnection({
host: 'aas45fvulvy4im.ctk1dcrepiao.us-west-2.rds.amazonaws.com',
user: 'admin',
password: 'password',
port: '3306',
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
})*/


exports.checkuser = function(req, res) {
    var data = { UserPoolId : 'us-west-2_jZ4pJevzH',
    ClientId : '5p2f3mg30g2gmefmsdh9k64mrs'
};
var userPool = new AmazonCognitoIdentity.CognitoUserPool(data);
var cognitoUser = userPool.getCurrentUser();
console.log(cognitoUser);

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

  if(name == 'Admin Admin') {
    res.send('Cannot have this name');
    return;
  }
  
  attributeList.push(new AmazonCognitoIdentity.CognitoUserAttribute({ Name: "email", Value: email }));
  attributeList.push(new AmazonCognitoIdentity.CognitoUserAttribute({Name:"name",Value:name}));
  userPool.signUp(email, password, attributeList, null, function (err, result) {
    if (err)
        res.json(err);
    var cognitoUser = result.user;
    res.send("Registered User: " + name );
  })
}

exports.login = function (body, callback) {
  var userName = body.body.email;
  var password = body.body.password;
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
          logged_in = accesstoken;
          log_user_name = result['idToken']['payload']['name']
          if(log_user_name == 'Admin Admin') admin = true; 
          callback.render('loggedin', {"name": result['idToken']['payload']['name']});
       },
       onFailure: (function (err) {
         logged_in = ""
          callback.send(err)
      })
  })
};


exports.addImage = function(req, res) {
    res.json(req.file.originalname + " Added");
    /*let awsConfig = {
      "region": "us-west-2",
      "endpoint": "http://dynamodb.us-west-2.amazonaws.com",
      "accessKeyId": 'AKIA6G5SFHWXNGMW4APM',
      "secretAccessKey": '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'
    }
    aws.config.update(awsConfig);
    let docClient = new aws.DynamoDB.DocumentClient();
    let save = function() {
      var input = {"filename": req.file.originalname, "user": log_user_name, "time": Date.now().toString()}
    var params = {TableName: "Image", Item: input} 
    docClient.put(params, function(err, data) {
      if(err) {
        res.send(err)
      }
      else {
        res.send(data)
      }
    });  
    }*/
};

exports.updateImage = function(req, res) {
  console.log(req);
  var key = req.params.updateid;
  var deletes = s3bucket.deleteObject({Bucket:'raymondho.net', Key: key}, function(err, data) {
    if(err) console.log(err)
  });
  res.render('done');
}

exports.logout = function(req, res) {
  logged_in = ""
  log_user_name = ""
  admin = ""
  res.render("notlogin");
}

exports.showhome = async function(req,res) {
  if(logged_in == "")  {
    res.render("notlogin");
    return;
  }
  aws.config.setPromisesDependency();
   const image = await s3bucket.listObjectsV2({Bucket:'raymondho.net'}).promise();
   var array = [];
   var key = []
  for(var a = 0; a < image['Contents'].length; a++) {
    array.push("http://d2tmb4hokmhume.cloudfront.net/"+image['Contents'][a]['Key']);
    key.push(image['Contents'][a]['Key']);
  }
    if(admin) res.render('admin',{data: array, key: key});
    res.render('index',{data: array, key: key,  user: log_user_name});
}

exports.showadmin = async function(req,res) {
  if(!admin) {
    res.send('NOT AN ADMIN');
    return;
  }
  aws.config.setPromisesDependency();
   const image = await s3bucket.listObjectsV2({Bucket:'raymondho.net'}).promise();
   var array = [];
   var key = []
  for(var a = 0; a < image['Contents'].length; a++) {
    console.log(image['Contents'][a]);
    array.push("http://d2tmb4hokmhume.cloudfront.net/"+image['Contents'][a]['Key']);
    key.push(image['Contents'][a]['Key']);
  }
    res.render('admin',{data: array, key: key});
} 

exports.deleteadmin = function(req, res) {
  var key = req.body.deleteid;
  var deletes = s3bucket.deleteObject({Bucket:'raymondho.net', Key: key}, function(err, data) {
    if(err) console.log(err)
    res.render("deleteadmin");
  });
}

exports.showcreate = function(req,res) {
  if(logged_in == "")  {
    res.render("notlogin");
    return;
  }
  res.render('createimage');
}

exports.showdelete = function(req, res) {
  if(logged_in == "")  {
    res.render("notlogin");
    return;
  }
  res.render('deleteimage');
}

exports.showupdate = function(req, res) {
  if(logged_in == "")  {
    res.render("notlogin");
    return;
  }
  res.render('updateimage')
}

exports.showregister = function(req, res) {
  res.render('registerpage')
}
exports.showlogin = function(req, res) {
  res.render('loginpage')
}

exports.chooseupdate =  async function(req, res) {
  aws.config.setPromisesDependency();
   const image = await s3bucket.listObjectsV2({Bucket:'raymondho.net'}).promise();
   var array = [];
  for(var a = 0; a < image['Contents'].length; a++) {
    array.push("http://d2tmb4hokmhume.cloudfront.net/"+image['Contents'][a]['Key']);
  }
    res.render('chooseupdate',{data: array});
}

exports.startupdate = function(req, res) {
  res.render('updateimage', req.params);
}


exports.deleteImage = function(req, res) {
var key = req.body.deleteid;
console.log(key);
var deletes = s3bucket.deleteObject({Bucket:'raymondho.net', Key: key}, function(err, data) {
  if(err) console.log(err)
  res.send("Deleted " + key);
});

};
