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

      collection.find().sort({uploadDate: -1}).toArray(function (err, result) {
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
        db.close();
      });
    }
  });

});

app.get('/upload', function(req, res) {
  res.render('pages/upload');
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
   console.log("\nPOST /upload req.body:");
   console.log(req.body);

    mongodb.MongoClient.connect(url, function (err, db) {
      if (err) {
        console.log('Unable to connect to the mongoDB server. Error:', err);
        res.send('System unavailable. try again later!');
      } else {
        console.log('Connection established to', url);

        var collection = db.collection('videos');

        //Create some videos
        var video = {
          user: 'videoplaybro', 
          loops:1, 
          filename: req.body.videoUrl,
          category: req.body.category,
          shopUrl: req.body.shopUrl,
          uploadDate: new Date()
        };

        collection.insert(video, function (err, result) {
          if (err) {
            console.log(err);
            res.send('System unavailable. try again later!');
          } else {
            console.log('Inserted %d documents into the "videos" collection. The documents inserted with "_id" are:', result.result.n, result);
            res.redirect('/');
          }
          db.close();
        });
      }
    });

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
      var videos = [
        {user: 'teeswizzle', loops:1, filename: 'https://' + S3_BUCKET + '.s3.amazonaws.com/' + 'blueDress' + '.mp4', shopUrl: 'http://m.macys.com/shop/product/lauren-ralph-lauren-belted-three-quarter-sleeve-dress?ID=2341829&CategoryID=5449&LinkType=#fn=PAGEINDEX%3D2%26sp%3D2%26spc%3D1381%26slotId%3D71%26kws%3Dblue%20dress', category: 'women', uploadDate: new Date(2015, 7, 30) },
        {user: 'teeswizzle', loops:1, filename: 'https://' + S3_BUCKET + '.s3.amazonaws.com/' + 'earMuffs' + '.mp4', shopUrl: 'http://m.macys.com/shop/product/lauren-ralph-lauren-belted-three-quarter-sleeve-dress?ID=2341829&CategoryID=5449&LinkType=#fn=PAGEINDEX%3D2%26sp%3D2%26spc%3D1381%26slotId%3D71%26kws%3Dblue%20dress', category: 'women', uploadDate: new Date(2015, 7, 29) },
        {user: 'teeswizzle', loops:1, filename: 'https://' + S3_BUCKET + '.s3.amazonaws.com/' + 'longBoots' + '.mp4', shopUrl: 'http://m.macys.com/shop/product/bcbgeneration-beasly-tall-boots?ID=2422432&CategoryID=25122#fn=sp%3D1%26spc%3D79%26slotId%3D38%26kws%3Dlong%20boots', category: 'women', uploadDate: new Date(2015, 7, 28) },
        {user: 'teeswizzle', loops:1, filename: 'https://' + S3_BUCKET + '.s3.amazonaws.com/' + 'lipStick' + '.mp4', shopUrl: 'http://m.macys.com/shop/product/dolce-gabbana-dolce-matte-lipstick?ID=2177668&CategoryID=30077#fn=sp%3D1%26spc%3D160%26slotId%3D4%26kws%3Dlipstick', category: 'women', uploadDate: new Date(2015, 7, 27) },
        {user: 'teeswizzle', loops:1, filename: 'https://' + S3_BUCKET + '.s3.amazonaws.com/' + 'kateSpadeBag' + '.mp4', shopUrl: 'http://m.macys.com/shop/product/bcbgeneration-stripe-tote?ID=2181822&CategoryID=26846#fn=sp%3D1%26spc%3D10%26slotId%3D8%26kws%3Dtote%20striped', category: 'women', uploadDate: new Date(2015, 7, 26) },
        {user: 'teeswizzle', loops:1, filename: 'https://' + S3_BUCKET + '.s3.amazonaws.com/' + 'MKBlackDress' + '.mp4', shopUrl: 'http://m.macys.com/shop/product/inc-international-concepts-ruched-tulip-dress-only-at-macys?ID=2343724&CategoryID=5449&tdp=cm_app~zMCOM-NAVAPP~xcm_zone~zPDP_ZONE_A~xcm_choiceId~zcid630011-c2a969f7-868b-4f75-80b4-de00e2f3a24b%40H7%40customers%2Balso%2Bshopped%245449%242343724~xcm_srcCatID~zonsite_search~xcm_pos~zPos2', category: 'women', uploadDate: new Date(2015, 7, 25) },
        {user: 'teeswizzle', loops:1, filename: 'https://' + S3_BUCKET + '.s3.amazonaws.com/' + 'Glasses' + '.mp4', shopUrl: 'http://m.macys.com/shop/product/ray-ban-sunglasses-ray-ban-rb4224-49?ID=2329617&CategoryID=28295&LinkType=#fn=PAGEINDEX%3D6%26sp%3D6%26spc%3D840%26slotId%3D206%26kws%3Dsunglasses%20womens', category: 'women', uploadDate: new Date(2015, 7, 24) },
        {user: 'teeswizzle', loops:1, filename: 'https://' + S3_BUCKET + '.s3.amazonaws.com/' + 'pinkDress' + '.mp4', shopUrl: 'http://m.macys.com/shop/product/ralph-lauren-little-girls-gauze-smocked-dress?ID=2217182&CategoryID=5991&LinkType=&swatchColor=Yellow%20Flash#fn=sp%3D1%26spc%3D68%26slotId%3D22%26kws%3Dyellow%20dress', category: 'women', uploadDate: new Date(2015, 7, 23) },
        {user: 'teeswizzle', loops:1, filename: 'https://' + S3_BUCKET + '.s3.amazonaws.com/' + 'umbrella' + '.mp4', shopUrl: 'http://m.macys.com/shop/product/totes-travel-aoc-umbrella?ID=598480&CategoryID=47665#fn=sp%3D1%26spc%3D63%26slotId%3D8%26kws%3Dumbrella', category: 'women', uploadDate: new Date(2015, 7, 22) },
        {user: 'teeswizzle', loops:1, filename: 'https://' + S3_BUCKET + '.s3.amazonaws.com/' + 'greenDress' + '.mp4', shopUrl: 'http://m.macys.com/shop/product/rare-editions-little-girls-crochet-shift-dress?ID=2268673&CategoryID=5991&LinkType=&swatchColor=Mint#fn=PAGEINDEX%3D2%26sp%3D2%26spc%3D266%26slotId%3D61%26kws%3Dgreen%20dress', category: 'women', uploadDate: new Date(2015, 7, 21) },
        {user: 'teeswizzle', loops:1, filename: 'https://' + S3_BUCKET + '.s3.amazonaws.com/' + 'multiLipstick' + '.mp4', shopUrl: 'http://m.macys.com/shop/product/tory-burch-lip-color-gift-set?ID=2374187&CategoryID=30076#fn=sp%3D1%26spc%3D160%26slotId%3D14%26kws%3Dlipstick', category: 'women', uploadDate: new Date(2015, 7, 20) },
        {user: 'teeswizzle', loops:1, filename: 'https://' + S3_BUCKET + '.s3.amazonaws.com/' + 'Piano' + '.mp4', shopUrl: 'http://m.macys.com/shop/product/ralph-lauren-little-girls-gauze-smocked-dress?ID=2217182&CategoryID=5991&LinkType=&swatchColor=Yellow%20Flash#fn=sp%3D1%26spc%3D68%26slotId%3D22%26kws%3Dyellow%20dress', category: 'women', uploadDate: new Date(2015, 7, 19) },
        {user: 'teeswizzle', loops:1, filename: 'https://' + S3_BUCKET + '.s3.amazonaws.com/' + 'Running' + '.mp4', shopUrl: 'http://m.macys.com/shop/product/charter-club-plus-size-crochet-panel-elbow-sleeve-top?ID=2258690&CategoryID=55613&LinkType=#fn=sp%3D1%26spc%3D278%26slotId%3D16%26kws%3Dwhite%20blouse', category: 'women', uploadDate: new Date(2015, 7, 18) },
        {user: 'teeswizzle', loops:1, filename: 'https://' + S3_BUCKET + '.s3.amazonaws.com/' + 'UGC_Girl' + '.mp4', shopUrl: 'http://m.macys.com/shop/product/kasper-pinstriped-pants?ID=2094534&CategoryID=157#fn=sp%3D1%26spc%3D10%26slotId%3D4%26kws%3Dpinstripe%20pants%20women', category: 'women', uploadDate: new Date(2015, 7, 17) },
        {user: 'teeswizzle', loops:1, filename: 'https://' + S3_BUCKET + '.s3.amazonaws.com/' + 'tayloSwift' + '.mp4', shopUrl: 'http://m.macys.com/shop/product/guess-girls-embroidered-sequin-dress?ID=2405123&CategoryID=5991#fn=sp%3D1%26spc%3D17%26slotId%3D15%26kws%3Dsparkling%20dress', category: 'women', uploadDate: new Date(2015, 7, 16) },
        {user: 'teeswizzle', loops:1, filename: 'https://' + S3_BUCKET + '.s3.amazonaws.com/' + 'blackShirt' + '.mp4', shopUrl: 'http://m.macys.com/shop/product/lucky-brand-three-quarter-sleeve-crochet-trim-top-only-at-macys?ID=2264793&CategoryID=255#fn=sp%3D1%26spc%3D2376%26slotId%3D17%26kws%3Dwomens%20black%20shirt', category: 'women', uploadDate: new Date(2015, 7, 16) },


        {user: 'playvidbro', loops:1, filename: 'https://' + S3_BUCKET + '.s3.amazonaws.com/' + 'blackShirtMen' + '.mp4', shopUrl: 'http://m.macys.com/shop/product/izod-big-tall-solid-pocket-t-shirt?ID=2046326&CategoryID=30423#fn=sp%3D1%26spc%3D1711%26slotId%3D11%26kws%3Dt-shirt%20black', category: 'men', uploadDate: new Date(2015,6, 31) },
        {user:'playvidbro', loops:1, filename: 'https://' + S3_BUCKET + '.s3.amazonaws.com/' + 'blueShoes' + '.mp4', shopUrl: 'http://m.macys.com/shop/product/sebago-norwich-oxfords?ID=2280411&CategoryID=65&swatchColor=Navy#fn=sp%3D1%26spc%3D37%26slotId%3D25%26kws%3Dblue%20oxford', category: 'men', uploadDate: new Date(2015,6,30) },
        {user:'playvidbro', loops:1, filename: 'https://' + S3_BUCKET + '.s3.amazonaws.com/' + 'breakDance' + '.mp4', shopUrl: 'http://m.macys.com/shop/product/calvin-klein-black-two-button-slim-fit-tuxedo?ID=828277&CategoryID=17788&tdp=cm_app~zMCOM-NAVAPP~xcm_zone~zPDP_ZONE_A~xcm_choiceId~zcid630011-8d7f9d95-1263-48a1-9912-1dfec08addbf%40H7%40customers%2Balso%2Bshopped%2417788%24828277~xcm_srcCatID~z17788~xcm_pos~zPos2', category: 'men', uploadDate: new Date(2015,6,29) },
        {user:'playvidbro', loops:1, filename: 'https://' + S3_BUCKET + '.s3.amazonaws.com/' + 'brownShirt' + '.mp4', shopUrl: 'http://m.macys.com/shop/product/tommy-hilfiger-custom-fit-ivy-polo?ID=1990894&CategoryID=20640&LinkType=&swatchColor=Coconut%20Brown#fn=sp%3D1%26spc%3D191%26slotId%3D2%26kws%3Dmen%27s%20brown%20shirt', category: 'men', uploadDate: new Date(2015,6,28) },
        {user:'playvidbro', loops:1, filename: 'https://' + S3_BUCKET + '.s3.amazonaws.com/' + 'cologne' + '.mp4', shopUrl:'http://m.macys.com/shop/product/smashbox-camera-ready-cc-cream-dark-spot-correcting-spf-30-1-oz?ID=813643&CategoryID=30585&LinkType=#fn=SKIN_CARE_CATEGORY%3DBB Cream%26sp%3D1%26spc%3D40%26ruleId%3D%26slotId%3D14', category: 'men', uploadDate: new Date(2015,6,27) },
        {user:'playvidbro', loops:1, filename: 'https://' + S3_BUCKET + '.s3.amazonaws.com/' + 'goldChain' + '.mp4', shopUrl: 'http://m.macys.com/shop/product/signature-gold-rolo-chain-necklace-in-14k-gold?ID=1195283&CategoryID=9569#fn=sp%3D1%26spc%3D238%26slotId%3D12%26kws%3Dgold%20chain', category: 'men', uploadDate: new Date(2015,6,26) },
        {user:'playvidbro', loops:1, filename: 'https://' + S3_BUCKET + '.s3.amazonaws.com/' + 'GreyCoat' + '.mp4', shopUrl: 'http://m.macys.com/shop/product/bar-iii-slim-fit-soft-jacket?ID=2241593&CategoryID=16499#fn=sp%3D1%26spc%3D169%26slotId%3D24%26kws%3Dgrey%20blazer', category: 'men', uploadDate: new Date(2015,6,25) },
        {user:'playvidbro', loops:1, filename: 'https://' + S3_BUCKET + '.s3.amazonaws.com/' + 'GreyCoatWhitePants' + '.mp4', shopUrl: 'http://m.macys.com/shop/product/ray-ban-sunglasses-ray-ban-rb4165-54-justin?ID=2489102&CategoryID=58262#fn=sp%3D1%26spc%3D280%26slotId%3D1%26kws%3Dray%20ban%20sunglases', category: 'men', uploadDate: new Date(2015,6,24) },
        {user:'playvidbro', loops:1, filename: 'https://' + S3_BUCKET + '.s3.amazonaws.com/' + 'justinBieber' + '.mp4', shopUrl: 'http://m.macys.com/shop/product/polo-ralph-lauren-classic-chino-sports-cap?ID=2393021&CategoryID=47657#fn=sp%3D1%26spc%3D14401%26slotId%3D7%26kws%3Dmens%20cap', category: 'men', uploadDate: new Date(2015,6,23) },
        {user:'playvidbro', loops:1, filename: 'https://' + S3_BUCKET + '.s3.amazonaws.com/' + 'pommelHorse' + '.mp4', shopUrl: 'http://m.macys.com/shop/product/alfani-red-solid-black-slim-fit-suit-separates?ID=415415&CategoryID=17788#fn=sp%3D1%26spc%3D983%26slotId%3D3%26kws%3Dsuit', category: 'men', uploadDate: new Date(2015,6,22) },
        {user:'playvidbro', loops:1, filename: 'https://' + S3_BUCKET + '.s3.amazonaws.com/' + 'TomFordSuit' + '.mp4', shopUrl: 'http://m.macys.com/shop/product/bar-iii-charcoal-flannel-slim-fit-suit-separates-only-at-macys?ID=2360693&CategoryID=17788&LinkType=#fn=PAGEINDEX%3D2%26sp%3D2%26spc%3D446%26slotId%3D58%26kws%3Dmens%20suit', category: 'men', uploadDate: new Date(2015,6,21) },
        {user:'playvidbro', loops:1, filename: 'https://' + S3_BUCKET + '.s3.amazonaws.com/' + 'vansShoes' + '.mp4', shopUrl: 'http://m.macys.com/shop/product/vans-chapman-stripe-sneakers?ID=2481756&CategoryID=65#fn=sp%3D1%26spc%3D43%26slotId%3D6%26kws%3Dvans%20shoes', category: 'men', uploadDate: new Date(2015,6,20) },
      ];



      collection.insert(videos, function(err, result) {
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

app.get('/api/cleardb', function(req, res) {
  // Use connect method to connect to the Server
  mongodb.MongoClient.connect(url, function (err, db) {
    if (err) {
      console.log('Unable to connect to the mongoDB server. Error:', err);
    } else {
      console.log('Connection established to', url);

      var collection = db.collection('videos');

      collection.drop(function (err, result) {
        if (err) {
          console.log(err);
        } else {
          console.log('Dropped videos collection');
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



