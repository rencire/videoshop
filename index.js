var express = require('express');
var app = express();

app.set('port', (process.env.PORT || 5000));

app.use('/public', express.static(__dirname + '/public'));

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
app.get('/', function(request, response) {
  response.render('pages/index', {
        user: user
    })
});

app.get('/comment', function(request, response) {
  response.render('pages/db',{
  	comment:comment
  })
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});


