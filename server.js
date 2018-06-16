// Dependencies
var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");
// Requiring our Note and Article models
var Note = require("./models/Note.js");
var Article = require("./models/Article.js");
// Our scraping tools
var request = require("request");
var cheerio = require("cheerio");
// Set mongoose to leverage built in JavaScript ES6 Promises
mongoose.Promise = Promise;
// Initialize Express
var app = express();
// Use morgan and body parser with our app
app.use(logger("dev"));
app.use(bodyParser.urlencoded({
    extended: false
}));
// Make public a static dir
app.use(express.static("public"));
// Database configuration with mongoose
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/sraper"
mongoose.connect(MONGODB_URI);
var db = mongoose.connection;
// Show any mongoose errors
db.on("error", function(error) {
    console.log("Mongoose Error: ", error);
});
// Once logged in to the db through mongoose, log a success message
db.once("open", function() {
    console.log("Mongoose connection successful.");
});
// Routes
// ======
// A GET request to scrape the echojs website
app.get("/scrape", function(req, res) {
    console.log("Scrape route hit");
    // First, we grab the body of the html with request
    request("http://www.nytimes.com/", function(error, response, html) {
        // Then, we load that into cheerio and save it to $ for a shorthand selector
        var $ = cheerio.load(html);
        // Save an empty result object
            var result = [];
        // Now, we grab every h2 within an article tag, and do the following:
        $("article.story").has("h2").each(function(i, element) {
             console.log("in article");
            
            // Add the text and href of every link, and save them as properties of the result object
          var title = $(this).children("h2").children("a").text();
          var link = $(this).children("h2").children("a").attr("href");
          var summary = $(this).children("p").first().text();            

          console.log(result);

            // Using our Article model, create a new entry
            // This effectively passes the result object to the entry (and the title and link)
            var entry = new Article({
                title: title,
                link: link,
                summary: summary
            });
            // Now, save that entry to the db
            entry.save(function(err, doc) {
                // Log any errors
                if (err) {
                    console.log(err);
                }
                // Or log the doc
                else {
                    console.log(doc);
                }
            });
        });
        res.send("Scrape Complete");
    });
    // Tell the browser that we finished scraping the text
    
});
// This will get the articles we scraped from the mongoDB
app.get("/articles", function(req, res) {
    // TODO: Finish the route so it grabs all of the articles

// app.get("/all", function(req, res) {
//     // Find all notes in the notes collection
    Article.find({}, function(err, doc) {
        // log any errors
        if (err) {
            console.log(err);
        }
        // or send the doc to the browser as a json object
        else {
            res.json(doc);
        }
    });
});
// This will grab an article by it's ObjectId
app.get("/articles/:id", function(req, res) {

    Article.findOne({ '_id': req.params.id })
        .populate('note')
        .exec(function(err, doc) {
            if (err) {
                console.log(err);
            } else {
                res.json(doc);
             }
        });
    
});

// this is my delete mongodb to delete notes.
app.post('/clearall/:id', function(req, res) {
    // using the id passed in the id parameter,
    // prepare a query that finds the matching one in our db...
    console.log(req.params.id);
    Note.findOne({ '_id': req.params.id })
        // and populate all of the notes associated with it.
        .remove('note')
        // now, execute our query
        .exec(function(err, doc) {
            // log any errors
            if (err) {
                console.log(err);
            }
            // otherwise, send the doc to the browser as a json object
            else {
                res.json(doc);
            }
        });
});

// Create a new note or replace an existing note
app.post("/articles/:id", function(req, res) {

    var newNote = new Note(req.body);

    // and save the new note the db
    newNote.save(function(err, doc) {
        // log any errors
        if (err) {
            console.log(err);
        }
        // otherwise
        else {
            // using the Article id passed in the id parameter of our url,
            // prepare a query that finds the matching Article in our db
            // and update it to make it's lone note the one we just saved
            Article.findOneAndUpdate({ '_id': req.params.id }, { $set: { "note": doc._id } }, { new: true })
                // execute the above query
                .exec(function(err, newdoc) {
                    // log any errors
                    if (err) {
                        console.log(err);
                    } else {
                        // or send the document to the browser
                        res.send(newdoc);
                    }
                });
        }
    });
});

// Update just one note by an id
app.post("/update/:id", function(req, res) {
  
  // When searching by an id, the id needs to be passed in
  // as (mongojs.ObjectId(IDYOUWANTTOFIND))

  // Update the note that matches the object id
  db.notes.update({
    "_id": mongojs.ObjectId(req.params.id)
  }, {
    // Set the title, note and modified parameters
    // sent in the req's body.
    $set: {
      "title": req.body.title,
      "note": req.body.note,
      "modified": Date.now()
    }
  }, function(error, edited) {
    // Log any errors from mongojs
    if (error) {
      console.log(error);
      res.send(error);
    }
    // Otherwise, send the mongojs response to the browser
    // This will fire off the success function of the ajax request
    else {
      console.log(edited);
      res.send(edited);
    }
  });
});

// Delete One from the DB
app.get("/delete/:id", function(req, res) {
  // Remove a note using the objectID
  db.notes.remove({
    "_id": mongojs.ObjectID(req.params.id)
  }, function(error, removed) {
    // Log any errors from mongojs
    if (error) {
      console.log(error);
      res.send(error);
    }
    // Otherwise, send the mongojs response to the browser
    // This will fire off the success function of the ajax request
    else {
      console.log(removed);
      res.send(removed);
    }
  });
});


// Clear the DB
app.get("/clearall", function(req, res) {
  // Remove every note from the notes collection
  db.notes.remove({}, function(error, response) {
    // Log any errors to the console
    if (error) {
      console.log(error);
      res.send(error);
    }
    // Otherwise, send the mongojs response to the browser
    // This will fire off the success function of the ajax request
    else {
      console.log(response);
      res.send(response);
    }
  });
});


// Listen on port 8080
app.listen(process.env.PORT || 8080, function() {
    console.log("App running on port 8080!");
});