var argv = require('optimist').argv;
var express = require('express');
var ejs = require('ejs');
var request = require('request');
var _ = underscore = require('underscore');
var fs = require('fs');

//command Line parameters
var options = {
	port: process.env.PORT||8000
};
if (argv.p) options.port = argv.p;
if (argv.port) options.port = argv.port;

this.app = app = express();
app.configure(function() {
	app.set('views', __dirname+"/views/");
	app.use(express.static(__dirname + "/static/"));
	app.set('view engine', 'ejs');
	app.set("view options", {layout: false});
	app.engine('html', require('ejs').renderFile);
	app.use(express.cookieParser()); 
});
app.engine('html', require('ejs').renderFile);


var DUEL_IS_OPEN = false;

VOTI =  {
	giuria: { a: 0, b: 0 },
	pubblico: { a: 0, b: 0 },
};

//using
app.use(function(req, res, next){ //on each request coming to our server...
	fs.writeFile('VOTI-data.txt', JSON.stringify(VOTI), function (err) {
		if (err) throw err;
	});
	next(); //and move on...
});

//routing
app.get('/', function(req, res) {
	res.render('index', { 
		_ : underscore,
		messaggio: null,
		risultati: null,
		DUEL_IS_OPEN: DUEL_IS_OPEN,
		VOTI: VOTI
	});
});
app.get('/vota1', function(req, res) {
	VOTI.pubblico.a = VOTI.pubblico.a +1; 
	res.render('index', { 
		_ : underscore,
		messaggio: 'Hai votato 1',
		risultati: null,
		DUEL_IS_OPEN: DUEL_IS_OPEN,
		VOTI: VOTI
	});
});
app.get('/vota2', function(req, res) {
	VOTI.pubblico.b = VOTI.pubblico.b +1;
	res.render('index', { 
		_ : underscore,
		messaggio: 'Hai votato 2',
		risultati: null,
		DUEL_IS_OPEN: DUEL_IS_OPEN,
		VOTI: VOTI
	});
});
app.get('/risultati', function(req, res) {
	res.send(JSON.stringify(VOTI));
});

app.get('/open', function(req, res) {
	DUEL_IS_OPEN = true;
	res.redirect("/");
})
app.get('/close', function(req, res) {
	DUEL_IS_OPEN = false;
	res.redirect("/");
})

//start
app.listen(options.port);
console.log('http://localhost:'+options.port);