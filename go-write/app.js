var express = require('express');
var http = require('http');
var uId = require('node-uuid');
var MongoStore = require('connect-mongo')(express);
var sessionStore = MongoStore({
	'db': 'mongosession',
	'auto_reconnect': true
});

var collections = ["users", "books"];
var db = require("mongojs").connect("mongodb://localhost/go-write", collections);

var app = express();
var httpServer = http.createServer(app);

// Sets EmbeddedJS (ejs) as the render engine
app.set('view engine', 'ejs');

// Express parses the document with "bodyParser"
app.use(express.bodyParser());
app.use(express.cookieParser());
app.use(express.session({
	'secret': 'gowrite',
	'store': sessionStore
}));

// directories linking
app.use(express.static('images'));
app.use(express.static('views/css'));
app.use(express.static('views/js/ckeditor'));


// Landing Page
app.get('/', function(req, res) {
	if(!!req.session.user) {
		res.redirect('/profile');
	} else {
		res.render('landing');
	}
});


// Signup/Register
app.post('/signup', function(req, res) {
	var newUser = {
		id: uId.v4(),
		type: 'user',
		email: req.body.email,
		username: req.body.username,
		password: req.body.password
	};

	db.users.findOne({email:newUser.email}, function(err, successs) {
		if(!successs) {
			db.users.save({id:newUser.id, type:newUser.type, email:newUser.email, username:newUser.username, password:newUser.password});

			// sets session variables
			req.session.user = {};
			req.session.user.username = successs.username;
			console.log("user added");
			res.redirect('/profile');
		} else {
			console.log("user already exists");
			res.redirect('/error');
		}
	});
});


// Login
app.post('/login', function(req, res) {
	db.users.findOne({email:req.body.email, password:req.body.password}, function(err, successs) {
		if(!!successs) {
			req.session.user = {};
			req.session.user.id = successs.id;
			req.session.user.username = successs.username;

			db.books.find({user_id:req.session.user.id}, function(err, bookResults) {
				if(!!bookResults) {
					req.session.books = bookResults
					// console.log(req.session.books);

					res.redirect('/profile');
				} else {
					console.log("No books found");
				}
			})
		} else {
			console.log("Incorrect username or password");
			res.render('landing');
		}
	})
});


// Signout
app.get('/signout', function(req, res) {
	req.session.user = false;
	res.redirect('/');
});


// Profile
app.get('/profile', function(req, res) {
	if(!!req.session.user) {
		db.books.find({user_id:req.session.user.id}, function(err, bookResults) {
			if(!!bookResults) {
				req.session.books = bookResults
				// console.log(req.session.books);
			} else {
				console.log("No books found");
			}
		})
		res.render('profile', {user:req.session.user.username,books:req.session.books});
	} else {
		res.redirect('/');
	}
});


// Render "Create page"
app.get('/new', function(req,res) {
	if(!!req.session.user) {
		res.render('new');
	} else {
		console.log("no user logged in");
		res.redirect('/');
	}
})


// Add New Book
app.post('/add', function(req, res) {
	var newBook = {
		book_id: uId.v1(),
		user_id: req.session.user.id,
		type: 'book',
		title: req.body.title,
		genre: req.body.genre,
		content: req.body.content,
		last_updated: "January 1st, 2014 01:33pm"
	}

	db.books.findOne({book_id:newBook.book_id}, function(err, successs) {
		if(!successs) {	
			db.books.save({book_id:newBook.book_id, user_id:newBook.user_id, type:newBook.type, title:newBook.title, genre:newBook.genre, content:newBook.content, last_updated:newBook.last_updated});
			console.log("Book '"+newBook.title+"'' added");
			res.redirect('/profile');
		} else {
			console.log("Book already exists");
			res.redirect('/new');
		}
	})	
})

app.get('/delete', function(req, res) {
	console.log(req.params.title);
	// db.books.findOne({user_id:req.session.user.id,title:r})
})


// Error
app.get('/error', function(req, res) {
	res.send('Error');
});


// Connection to port
httpServer.listen(3000, function() {
	console.log('Listening on port 3000');
});