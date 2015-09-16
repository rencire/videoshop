var express = require('express');
var fs = require('fs');
var multer = require('multer');

var done = false;
var upload = multer({
  dest:'./uservids/',
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
});

var app = express();

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

var count = 0;
app.post('/api/upload', upload.single('video'), function(req, res) {
  var filename = 'test' + count.toString();
    // debugger
    console.log(req.body);
    console.log(req.file);
     if(done==true){
       console.log(req.files);
       res.end("File uploaded.");
     }
    // console.log(req.files.video);
    // fs.writeFile("./uservids/" + filename, req.body, function(err) {
    //     if(err) {
    //       return console.log(err);
    //     }
    //     console.log("The file " + filename + "was saved!");
    //     count +=1;
    // }); 
});


app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});



