
'use strict';



var multiparty = require('multiparty');
global.logged_in = "";
global.log_user_name = "";

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

exports.getImageDB = function(req, res)  {
  if(isDev) {
      AWS.config.update(config.aws_local_config);
    } else {
      AWS.config.update(config.aws_remote_config);
    }
    const image = req.body.name;
    const docClient = new AWS.DynamoDB.DocumentClient();
    const params = {
      TableName: config.aws_table_name,
      KeyConditionExpression: 'filename = :i',
      ExpressionAttributeValues: {
        ':i': image
      }
    };
    docClient.query(params, function(err, data) {
      if (err) {
        res.send({
          success: false,
          message: 'Error: Server error'
        });
      } else {
        console.log('data', data);
        const { Items } = data;
        res.send({
          success: true,
          message: 'Loaded Image',
          images: Items
        });
      }
    });
  };

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
          callback.send("WELCOME USER : " + result['idToken']['payload']['name']);
       },
       onFailure: (function (err) {
         logged_in = ""
          callback.send(err)
      })
  })
};


exports.addImage = function(req, res) {
    res.json(req.file);
    if (isDev) {
      AWS.config.update(config.aws_local_config);
    } else {
      AWS.config.update(config.aws_remote_config);
    }
    const filename = req.file.originalname;
    const docClient = new AWS.DynamoDB.DocumentClient();
    const params = {
      TableName: config.aws_table_name,
      Item: {
        filename: filename,
        name: log_user_name,
        time: Date.now().toString()
      }
    };
    docClient.put(params, function(err, data) {
      if (err) {
        res.send({
          success: false,
          message: 'Error: Server error'
        });
      } else {
        console.log('data', data);
        const { Items } = data;
        res.send({
          success: true,
          message: 'Image Added',
          file: filename
        });
      }
    });
};

exports.updateImage = function(req, res) {
  console.log(req);
  var key = req.params.updateid;
  var deletes = s3bucket.deleteObject({Bucket:'raymondho.net', Key: key}, function(err, data) {
    if(err) console.log(err)
  });
  res.json(req.file);
}

exports.showhome = async function(req,res) {
  if(logged_in == "")  {
    res.send("NOT LOGGED IN");
    return;
  }
  aws.config.setPromisesDependency();
   const image = await s3bucket.listObjectsV2({Bucket:'raymondho.net'}).promise();
   var array = [];
  for(var a = 0; a < image['Contents'].length; a++) {
    array.push("http://d2tmb4hokmhume.cloudfront.net/"+image['Contents'][a]['Key']);
  }
    res.render('index',{data: array, user: log_user_name});
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

exports.getImages = async function(req, res) {
  aws.config.setPromisesDependency();
   const image = await s3bucket.listObjectsV2({Bucket:'raymondho.net'}).promise();
   var array = [];
  for(var a = 0; a < image['Contents'].length; a++) {
    array.push("https://s3-us-west-1.amazonaws.com/raymondho.net/"+image['Contents'][a]['Key']);
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
