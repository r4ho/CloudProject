'use strict';
module.exports = function(app) {
  var todoList = require('../controllers/todoListController');
  var bodyParser = require('body-parser');
  var methodOverride = require('method-override');

  var aws = require('aws-sdk')
var express = require('express')
var multer = require('multer')
var multerS3 = require('multer-s3')
var s3bucket = new aws.S3({ 
  accessKeyId: 'AKIA6G5SFHWXNGMW4APM',
  secretAccessKey: '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',
  Bucket: 'raymondho.net'
})
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

  app.use(bodyParser.json());
  app.use(methodOverride('_method'));
  app.set('view engine', 'ejs');
  // todoList Routes
  app.route("/")
    .get(todoList.showhome);
  app.route("/showcreate")
    .get(todoList.showcreate);
  app.route("/showdelete")
    .get(todoList.showdelete);
  app.route("/showupdate")
    .get(todoList.showupdate);
  app.route("/chooseupdate")
    .get(todoList.chooseupdate)

  app.route("/showregister")
  .get(todoList.showregister);
  app.route("/showlogin")
  .get(todoList.showlogin);


  app.route("/register")
  .post(todoList.register);
  app.route("/login")
  .post(todoList.login);

  app.route('/getImages')
    .get(todoList.getImages);
  app.route('/upload')
    .post(upload.single('file'), todoList.addImage);
  app.route('/delete')
    .post(todoList.deleteImage);
  app.route('/update/:updateid')
  .get(todoList.startupdate)
  .post(todoList.updateImage);
}


  
