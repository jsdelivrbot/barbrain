var express = require('express');
var request = require('request');
var cors = require('cors');
var app = express();
app.use(cors());

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/', function(request, response) {
  response.render('pages/index');
});

// app.listen(app.get('port'), function() {
//   console.log('Node app is running on port', app.get('port'));
//  });

var path = require("path");
var bodyParser = require("body-parser");
var mongodb = require("mongodb");
var ObjectID = mongodb.ObjectID;

var GOALS_COLLECTION = "goals";
var TACTICS_COLLECTION = "tactics";
var SALES_COLLECTION = "sales"

var STAFF_COLLECTION = "staff";
var TICKETS_COLLECTION = "tickets";
app.use(bodyParser.json());

// Create a database variable outside of the database connection callback to reuse the connection pool in your app.
var db;

// Connect to the database before starting the application server.
mongodb.MongoClient.connect(process.env.MONGODB_URI, function (err, database) {
  if (err) {
    console.log(err);
    process.exit(1);
  }

  // Save database object from the callback for reuse.
  db = database;
  console.log("Database connection ready");

  // Initialize the app.
  var server = app.listen(process.env.PORT || 8080, function () {
    var port = server.address().port;
    console.log("App now running on port", port);
  });
});


app.get("/goals", function(req, res) {
  db.collection(GOALS_COLLECTION).find({}).toArray(function(err, docs) {
    if (err) {
      handleError(res, err.message, "Failed to get goals.");
    } else {
      res.status(200).json(docs);
    }
  });
});

app.post("/updateGoals", function(req, res) {
  var newGoal = req.body;
  newGoal.createDate = new Date();

  db.collection(GOALS_COLLECTION).updateOne(
	   { location: "10 Barrel Boise" },
	   {
	     $set: {
	       dailyGoal: newGoal.dailyGoal,
	       weeklyGoal: newGoal.weeklyGoal
	     }
	   }, function(err, doc)  {
	   	if (err)  {
	   		handleError(res, err.message, "Failed to update goals.");
	   	} else {
	   		res.status(200).end();
	   		//res.status(204).end();
	   	}
   });
});


app.get("/tactics", function(req, res) {
  db.collection(TACTICS_COLLECTION).find({}).toArray(function(err, docs) {
    if (err) {
      handleError(res, err.message, "Failed to get tactics.");
    } else {
      res.status(200).json(docs);
    }
  });
});

app.post("/updateTactics", function(req, res)  {
	var newTactics = req.body;
	newTactics.createDate = new Date();

	db.collection(TACTICS_COLLECTION).updateOne(
		{ location: "10 Barrel Boise" },
		{
			$set: {
				dailyTactics: newTactics.tactics.dailyTactics,
        weeklyTactics: newTactics.tactics.weeklyTactics
			}
		}, function(err, doc)  {
			if (err)  {
				handleError(res, err.message, "Failed to update tactics.");
			} else {
				res.status(200).end();
			}
		});
});

app.get("/staff", function(req, res) {
  db.collection(STAFF_COLLECTION).find({}).toArray(function(err, docs) {
    if (err) {
      handleError(res, err.message, "Failed to get staff.");
    } else {
      res.status(200).json(docs);
    }
  });
});

app.post("/updateStaff", function(req, res)  {
  var newStaff = req.body;
  newStaff.createDate = new Date();

  db.collection(TACTICS_COLLECTION).updateOne(
    { location: "10 Barrel Boise" },
    {
      $set: {
        staff : newStaff
      }
    }, function(err, doc)  {
      if (err)  {
        handleError(res, err.message, "Failed to update Staff.");
      } else {
        res.status(200).end();
      }
    });
});

app.get("/weeklySales", function(req, res)  {
	db.collection(SALES_COLLECTION).find({}).toArray(function(err, docs)  {
		if (err)  {
			handleError(res, err.mesage, "Failed to get sales.");
		} else {
			res.status(200).json(docs);
		}
	});
});

app.get("/staff/:location", function(req, res)  {
	var location = req.params.location;
	db.collection(STAFF_COLLECTION).find({ "location": parseInt(location)}).toArray(function(err, docs)  {
		if (err) {
			handleError(res, err.message, "Failed to get staff.");
		} else {
			res.status(200).json(docs);
		}
	});
});

Date.prototype.getUnixTime = function() { return this.getTime()/1000|0 };
if(!Date.now) Date.now = function() { return new Date(); }
Date.time = function() { return Date.now().getUnixTime(); }

app.post("/webhookUpdate/:location", function(req, res)  {
  var today = new Date();
  today.setHours(0,0,0,0);
  today.setDate(today.getDate() - 1);

  var options = {
    url: 'https://api.omnivore.io/1.0/locations/jcyazEnc/tickets?limit=100&where=gte(opened_at,' + today.getUnixTime(),
    headers: {
      'Api-Key': '5864a33ba65e4f0390b5994c13b15fe4'
    }
  };

  function callback (error, response, body)  {
    if (!error && response.statusCode == 200)  {
      var total = 0.0;
        var info = JSON.parse(body);
        var tickets = info._embedded.tickets;
        for (var i = 0, len = tickets.length; i < len; i++)  {
          if (tickets[i].closed_at != null)  {
            db.collection(TICKETS_COLLECTION).updateMany(
            {
              id: tickets[i].id
            },
            {
              $set: {
                id: tickets[i].id,
                total: tickets[i].totals.total / 100,
                opened_at: tickets[i].opened_at,
                closed_at: tickets[i].closed_at
              }
            },  
            {
              upsert: true,
            });
            total += tickets[i].totals.total / 100;
            console.log(tickets[i]);
          }
        }

      console.log(total);
      db.collection(GOALS_COLLECTION).updateOne({
        location: 1
      },
      {
        $set: {
          dailyProgress: total
        }
      });
    }
  }

  request(options, callback);

  res.status(200).end();

  // var dailySales = 90;
  // var weeklySales = 200;
  // db.collection(GOALS_COLLECTION).updateOne({
  //   location: 1
  // },
  // {
  //   $set: {
  //     dailyProgress : dailySales,
  //     weeklyProgress: weeklySales
  //   }
  // }, function(err, doc)  {
  //   if (err)  {
  //     handleError(res, err.message, "Failed to update sales.");
  //   } else {
  //     res.status(200).end();
  //   }
  // });
  // poll Omnivore API to grab all tickets for today & accumulate total sales
  // poll Omnivore API to grab all tickets for week & accumulate total sales
  // store daily sales and then just add for week
  // then update database

});

app.get("/webhookUpdate/:location", function(req, res)  {
  res.send("c6d1b589165541368d1faccee55a3163").end();
});


app.get("/sales", function(req, res) {
  db.collection(SALES_COLLECTION).find({}).toArray(function(err, docs) {
    if (err) {
      handleError(res, err.message, "Failed to get sales.");
    } else {
      res.status(200).json(docs);
    }
  });
});


app.post("/updateSales", function(req, res)  {
  var newSales = req.body;
  newSales.createDate = new Date();

  db.collection(SalesSALES_COLLECTION).updateOne(
    { location: "10 Barrel Boise" },
    {
      $set: {
        sales : newSales
      }
    }, function(err, doc)  {
      if (err)  {
        handleError(res, err.message, "Failed to update Staff.");
      } else {
        res.status(200).end();
      }
    });
});

app.get("/lookupYesterdayLavu", function(req, res)  {

  // var api_url = "https://api.poslavu.com/cp/reqserv/";
  //   var datanameString = "cerveza_patago13";  
  //   var keyString = "XCXxRHUsSuF3n3D4s6Lm";
  //   var tokenString = "bsn9GpsHt8UClvnEukGa";
  //   var tableString = "orders";


    
    //var json_obj = JSON.parse(options);
    var yesterday = new Date();
    yesterday.setHours(3,0,0,0);
    yesterday.setDate(yesterday.getDate() - 1);
    var today = new Date();
    today.setHours(3,0,0,0);
    console.log(yesterday + ". " + today);

    request.post(api_url, {form:{dataname:datanameString,key:keyString,token:tokenString,table:tableString,valid_xml:1,limit:10000,column:"closed",value_min: yesterday.toISOString().substring(0, 19).replace('T', ' '),value_max: today.toISOString().substring(0, 19).replace('T', ' ')}
    },function(error, response, body){
      res.send(body).status(200).end();
      //console.log(body)
    });
});

var api_url = "https://api.poslavu.com/cp/reqserv/";
var datanameString = "";//"cerveza_patago13";  // cerveza_patago9
var keyString = "";//"XCXxRHUsSuF3n3D4s6Lm"; // Wut9Y3BigxgEgChgzvNB
var tokenString = "";//"bsn9GpsHt8UClvnEukGa"; // YjVS0nEgBXI9gSh5dmuC
var tableString = "orders";

// Bariloche cerveza_patago13 XCXxRHUsSuF3n3D4s6Lm bsn9GpsHt8UClvnEukGa
// Tejeda cerveza_patago9 Wut9Y3BigxgEgChgzvNB YjVS0nEgBXI9gSh5dmuC
// Goose Island goose_island_p fUOEUo4DToNuuTLuda04 R65QzAE6RnctGY8Dta2n

app.get("/lookupLavuToday", function(req, res)  {
  var today = new Date();
    today.setHours(3,0,0,0);
    var tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    //console.log("daily: ");
    //console.log(today + ". " + tomorrow);

   request.post(api_url, {form:{dataname:datanameString,key:keyString,token:tokenString,table:tableString,valid_xml:1,limit:10000,column:"closed",value_min: today.toISOString().substring(0, 19).replace('T', ' '),value_max: tomorrow.toISOString().substring(0, 19).replace('T', ' ') }
    }, function(error, response, body)  {
      //console.log(body);
      res.send(body).status(200).end();
    });
});

app.get("/lookupLastWeekLavu", function(req, res)  {
  //var today = new Date();
  var d = new Date();
  var day = d.getDay(),
      diff = d.getDate() - day + (day == 0 ? -6:1); // adjust when day is sunday
  var lastMonday = new Date(d.setDate(diff));
  lastMonday.setHours(3,0,0,0);
  console.log("Last Monday: " + lastMonday);
  var today = new Date();
    today.setHours(3,0,0,0);
    var tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

  request.post(api_url, {form:{dataname:datanameString,key:keyString,token:tokenString,table:tableString,valid_xml:1,limit:10000,column:"closed",value_min: lastMonday.toISOString().substring(0, 19).replace('T', ' '),value_max: tomorrow.toISOString().substring(0, 19).replace('T', ' ') }
  }, function(error, response, body)  {
    //console.log(body);
    res.send(body).status(200).end();
  });
});

app.post("/updateTodaySales/:location", function(req, res)  {
  var locationParam = req.params.location;
  var newSales = req.body;
  newSales.createDate = new Date();

  db.collection(GOALS_COLLECTION).updateOne(
    {},
    {
      $set: {
        dailyProgress: newSales.dailyProgress
      }
    }, function(err, doc)  {
      if (err)  {
        handleError(res, err.message, "Failed to update goals.");
      } else {
        res.status(200).end();
      }
    });
});

Date.prototype.getUnixTime = function() { return this.getTime()/1000|0 };
if(!Date.now) Date.now = function() { return new Date(); }
Date.time = function() { return Date.now().getUnixTime(); }



app.post("/updateYesterdaySales/:location", function(req, res)  {
  var locationParam = req.params.location;
  var newSales = req.body;
  newSales.createDate = new Date();

  console.log(locationParam);
  console.log("sup: " + newSales.yesterdaySales);
  db.collection(GOALS_COLLECTION).updateOne(
    { },
    {
      $set:  {
        yesterdaySales: newSales.yesterdaySales
      }
    }, function(err, doc)  {
      if (err)  {
        handleError(res, err.message, "Failed to update tactics.");
      } else {
        res.status(200).end();
      }
    });
});

app.get("/lookupLavuOrder_Contents/:order_id", function(req, res)  {
  var order_idParam = req.params.order_id;
  request.post(api_url, {form:{dataname:datanameString,key:keyString,token:tokenString,table:"order_contents",valid_xml:1,limit:10000,column:"order_id",value:order_idParam }
    }, function(error, response, body)  {
      //console.log(body);
      res.send(body).status(200).end();
    });
});

app.get("/lookupLavuItems/:item_id", function(req, res)  {
  var item_idParam = req.params.item_id;
  request.post(api_url, {form:{dataname:datanameString,key:keyString,token:tokenString,table:"menu_items",valid_xml:1,limit:10000,column:"id",value:item_idParam }
    }, function(error, response, body)  {
      //console.log(body);
      res.send(body).status(200).end();
    });
});

app.get("/lookupLavuCategory/:category_id", function(req, res)  {
  var category_idParam = req.params.category_id;
  request.post(api_url, {form:{dataname:datanameString,key:keyString,token:tokenString,table:"menu_categories",valid_xml:1,limit:10000,column:"id",value:category_idParam }
    }, function(error, response, body)  {
      //console.log(body);
      res.send(body).status(200).end();
    });
});

app.get("/lookupLavuGroup/:group_id", function(req, res)  {
  var group_idParam = req.params.group_id;
  request.post(api_url, {form:{dataname:datanameString,key:keyString,token:tokenString,table:"menu_groups",valid_xml:1,limit:10000,column:"id",value:group_idParam }
    }, function(error, response, body)  {
      //console.log(body);
      res.send(body).status(200).end();
    });
});

app.get("/lookupLavuItems", function(req, res)  {
  request.post(api_url, {form:{dataname:datanameString,key:keyString,token:tokenString,table:"menu_items",valid_xml:1,limit:10000 }
    }, function(error, resposne, body)  {
      res.send(body).status(200).end();
    });
});

app.get("/resolveLocation/:location_id", function(req, res)  {
  var location_idParam = req.params.location_id;
  if (location_idParam == 0)  { // bariloche
    console.log("Choosing Bariloche");
    datanameString = "cerveza_patago13";
    keyString = "XCXxRHUsSuF3n3D4s6Lm";
    tokenString = "bsn9GpsHt8UClvnEukGa";
  } else if (location_idParam == 1)  { // tejeda
    console.log("Choosing Tejeda");
    datanameString = "cerveza_patago9";
    keyString = "Wut9Y3BigxgEgChgzvNB";
    tokenString = "YjVS0nEgBXI9gSh5dmuC";
  } else if (location_idParam == 2)  { // goose island
    console.log("Choosing Goose Island");
    datanameString = "goose_island_p";
    keyString = "fUOEUo4DToNuuTLuda04";
    tokenString = "R65QzAE6RnctGY8Dta2n";
  }
  res.status(200).end();
});

// Bariloche cerveza_patago13 XCXxRHUsSuF3n3D4s6Lm bsn9GpsHt8UClvnEukGa
// Tejeda cerveza_patago9 Wut9Y3BigxgEgChgzvNB YjVS0nEgBXI9gSh5dmuC
// Goose Island goose_island_p fUOEUo4DToNuuTLuda04 R65QzAE6RnctGY8Dta2n


