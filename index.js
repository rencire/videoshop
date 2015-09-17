var express = require('express');
var fs = require('fs');
var mongodb = require('mongodb');
var multer = require('multer');
var aws = require('aws-sdk');


var app = express();

var done = false;
app.use(multer({ dest: './uploads/',
  rename: function (fieldname, filename) {
    return filename+Date.now();
  },
  onFileUploadStart: function (file) {
    console.log(file.originalname + ' is starting ...')
  },
  onFileUploadComplete: function (file) {
    console.log(file.fieldname + ' uploaded to  ' + file.path);
    done=true;
  }
}));



app.use(express.static(__dirname + '/public'));

app.set('port', (process.env.PORT || 5000));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
var user = [
        { name: 'Bloody Mary', video: "http://grochtdreis.de/fuer-jsfiddle/video/sintel_trailer-480.mp4" },
        { name: 'Martini', video: "http://grochtdreis.de/fuer-jsfiddle/video/sintel_trailer-480.mp4" },
        { name: 'Scotch', video: "http://grochtdreis.de/fuer-jsfiddle/video/sintel_trailer-480.mp4" }
    ];

// AWS Env Vars
var AWS_ACCESS_KEY = process.env.AWS_ACCESS_KEY;
var AWS_SECRET_KEY = process.env.AWS_SECRET_KEY;
var S3_BUCKET = process.env.S3_BUCKET

app.get('/', function(request, response) {
  response.render('pages/index', {
        user: user
    })
});

app.get('/api/sign_s3', function(req, res) {
  // add check for only video files: .mp4, etc.
    
  aws.config.update({
    accessKeyId: AWS_ACCESS_KEY,
    secretAccessKey: AWS_SECRET_KEY
  });

  var s3 = new aws.S3();
  var s3_params = {
    Bucket: S3_BUCKET,
    Key: req.query.file_name,
    Expires: 60,
    ContentType: req.query.file_type,
    ACL: 'public-read'
  };

  s3.getSignedUrl('putObject', s3_params, function(err, data) {
    if(err){
      console.log(err);
    } else {
      var return_data = {
        signed_request: data,
        url: 'https://' + S3_BUCKET + '.s3.amazonaws.com/' + req.query.file_name
      }
      console.log('return_data:');
      console.log(return_data);
      res.json(return_data);
    }
  });
});

app.post('/api/upload', function(req, res) {
     if(done==true){
       console.log(req.files);
       res.end("File uploaded.");
     }
});

app.get('/api/videofiles', function(req, res) {
  
  fs.readdir('./uploads', function(err, files) {
    console.log(files);

    if (err) {
      console.error('Cannot read uploads directory');
      res.json({errorCode:42, msg:'Cannot read uploads directory'});
    } else {
      var nameList = {fileNames:files};
      res.json(nameList);
    }
  });
});


// test saving items to db
var url = process.env.MONGOLAB_URI
console.log(url);

app.get('/api/testdb', function(req, res) {

  console.log(url);
  // Use connect method to connect to the Server
  mongodb.MongoClient.connect(url, function (err, db) {
    if (err) {
      console.log('Unable to connect to the mongoDB server. Error:', err);
    } else {
      console.log('Connection established to', url);

      var collection = db.collection('videos');

      //Create some videos
      var video1 = {filename: 'abcd.mp4', category: 'men', tags:['men','hat', 'summer'] };
      var video2 = {filename: 'efgh.mp4', category: 'women', tags:['female','dress', 'flashy', 'fall'] };
      var video3 = {filename: 'strut.mp4', category: 'women', tags:['heels','tall', 'formal']};

      collection.insert([video1, video2, video3], function (err, result) {
        if (err) {
          console.log(err);
        } else {
          console.log('Inserted %d documents into the "videos" collection. The documents inserted with "_id" are:', result.result.n, result);
        }
        db.close();
      });
    }
  });
  res.send();
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});



