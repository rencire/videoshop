var express = require('express');
var fs = require('fs');
var multer = require('multer');
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
      console.log(file.fieldname + ' uploaded to  ' + file.path)
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
app.get('/', function(request, response) {
  response.render('pages/index', {
        user: user
    })
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


app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});



