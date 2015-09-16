var express = require('express');
var app = express();

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

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

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});


