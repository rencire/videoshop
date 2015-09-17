var express = require('express');
var fs = require('fs');
var mongodb = require('mongodb');
var aws = require('aws-sdk');
var bodyParser = require('body-parser');

var app = express();

app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

app.use('/web20/assets/img/nav/', express.static(__dirname + '/public/images'));
app.use('/public', express.static(__dirname + '/public'));



app.set('port', (process.env.PORT || 5000));


// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
var user = [
        { name: 'Mary', video: "http://grochtdreis.de/fuer-jsfiddle/video/sintel_trailer-480.mp4",loops:0,comment:[{user:"name",profilepic:"https://placeholdit.imgix.net/~text?txtsize=33&txt=30*30&w=30&h=10",comment:"test1"},{user:"name",profilepic:"https://placeholdit.imgix.net/~text?txtsize=33&txt=30*30&w=30&h=10",comment:"test2"}] },
        { name: 'Martini', video: "http://grochtdreis.de/fuer-jsfiddle/video/sintel_trailer-480.mp4",loops:0,comment:"50" ,comment:[{user:"name",profilepic:"https://placeholdit.imgix.net/~text?txtsize=33&txt=30*30&w=30&h=10",comment:"test1"},{user:"name",profilepic:"https://placeholdit.imgix.net/~text?txtsize=33&txt=30*30&w=30&h=10",comment:"test2"}]},
        { name: 'Scotch', video: "http://grochtdreis.de/fuer-jsfiddle/video/sintel_trailer-480.mp4",loops:0,comment:[{user:"name",profilepic:"https://placeholdit.imgix.net/~text?txtsize=33&txt=30*30&w=30&h=10",comment:"test1"},{user:"name",profilepic:"https://placeholdit.imgix.net/~text?txtsize=33&txt=30*30&w=30&h=10",comment:"test2"}] }
    ];


var comment=[
{picture:'https://placeholdit.imgix.net/~text?txtsize=33&txt=30*30&w=30&h=10',name:'user1',comment:'haha'},
{picture:'https://placeholdit.imgix.net/~text?txtsize=33&txt=30*30&w=30&h=10',name:'user1',comment:'haha'},
{picture:'https://placeholdit.imgix.net/~text?txtsize=33&txt=30*30&w=30&h=10',name:'user1',comment:'haha'},
{picture:'https://placeholdit.imgix.net/~text?txtsize=33&txt=30*30&w=30&h=10',name:'user1',comment:'haha'},
{picture:'https://placeholdit.imgix.net/~text?txtsize=33&txt=30*30&w=30&h=10',name:'user1',comment:'haha'},
{picture:'https://placeholdit.imgix.net/~text?txtsize=33&txt=30*30&w=30&h=10',name:'user1',comment:'haha'}
];

// AWS Env Vars
var AWS_ACCESS_KEY = process.env.AWS_ACCESS_KEY;
var AWS_SECRET_KEY = process.env.AWS_SECRET_KEY;
var S3_BUCKET = process.env.S3_BUCKET;

// DB connection string
var url = process.env.MONGOLAB_URI;


// Helper functions
function processPosts(posts, category) {
  return posts.filter(function(post) {
    return post.category === category;
  }).map(function(post) {
    post.filename = AWS_S3_HOST + post.filename;
    return post;
  });
}

// Routing
app.get('/', function(request, response) {
  mongodb.MongoClient.connect(url, function (err, db) {
    if (err) {
      console.log('Unable to connect to the mongoDB server. Error:', err);
      // TODO set http status codes
      res.json({error:"Could not connect to db"});
    } else {
      console.log('Connection established to', url);

      var collection = db.collection('videos');

      collection.find({}).toArray(function (err, result) {
        if (err) {
          console.log(err);
          res.json({error:"Could not videos retrieve from db "});

        } else {
          console.log('Retrieved %d documents from the "videos" collection. The documents retrieved are:', result.length, result);

          response.render('pages/index', {
            menposts:   result.filter(function(post) { return post.category === 'men' }),
            womenposts: result.filter(function(post) { return post.category === 'women' })
          });

        }
        db.close()
      });
    }
  });

});

app.get('/upload', function(req, res) {
  res.render('pages/upload', {
  });
});




app.get('/comment', function(request, response) {
  response.render('pages/db',{
  	comment:comment
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

app.post('/upload', function(req, res) {
     // if(done==true){
     //   console.log(req.files);
     //   res.end("File uploaded.");
     // }
     console.log(req.body);
     res.end("Video uploaded!");
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

app.get('/api/videos', function(req, res) {
  mongodb.MongoClient.connect(url, function (err, db) {
    if (err) {
      console.log('Unable to connect to the mongoDB server. Error:', err);
      // TODO set http status codes
      res.json({error:"Could not connect to db"});
    } else {
      console.log('Connection established to', url);

      var collection = db.collection('videos');

      collection.find({}).toArray(function (err, result) {
        if (err) {
          console.log(err);
          res.json({error:"Could not videos retrieve from db "});

        } else {
          console.log('Retrieved %d documents from the "videos" collection. The documents retrieved are:', result.length, result);
          res.json(result);
        }
        db.close()
      });
    }
  });
});

// test saving items to db

app.get('/api/loaddb', function(req, res) {
  // Use connect method to connect to the Server
  mongodb.MongoClient.connect(url, function (err, db) {
    if (err) {
      console.log('Unable to connect to the mongoDB server. Error:', err);
    } else {
      console.log('Connection established to', url);

      var collection = db.collection('videos');

      //Create some videos
      var video1 = {user: 'teeswizzle', loops:3, filename: 'https://' + S3_BUCKET + '.s3.amazonaws.com/cologne.mp4', category: 'men', tags:['men','hat', 'summer'] };
      var video2 = {user: 'starXOXO', loops:2, filename: 'https://' + S3_BUCKET + '.s3.amazonaws.com/Piano.mp4', category: 'women', tags:['female','dress', 'flashy', 'fall'] };
      var video3 = {user: 'azndragon008', loops:6, filename: 'https://' + S3_BUCKET + '.s3.amazonaws.com/longBoots.mp4', category: 'women', tags:['heels','tall', 'formal']};

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



