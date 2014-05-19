var express = require('express');
var uId = require('node-uuid');
var MongoStore = require('connect-mongo')(express);
var sessionStore = MongoStore({
	'db': 'mongosession',
	'auto_reconnect': true
})

var http = require('http');

var collections = ["users", "books"];
var db = require("mongojs").connect("mongodb://localhost/books", collections);

var app = express();
var httpServer = http.createServer(app);

// Sets EmbeddedJS (ejs) as the render engine
app.set('view engine', 'ejs');

app.get('/', function(req, res) {
    var book = db.books.findOne({genre:'Romance'});
    console.log(book);
    res.render('landing');
    
});

app.get('/hello', function(req, res) {
	res.send('Hello World');
});

httpServer.listen(3000, function() {
	console.log('Listening on port 3000');
});