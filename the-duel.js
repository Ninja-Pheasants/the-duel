var argv = require('optimist').argv;
var express = require('express');
var ejs = require('ejs');
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
	app.use(express.cookieParser('this is a very long hash. Please forget it! ok? :E'));
	app.use(express.session({
		key: 'Ninja Pheasants',
		secret: 'this is a very long hash. Please forge it! ok? :E'
	}));
});
app.engine('html', require('ejs').renderFile);

var LABEL_DUELLO_CHIUSO = 'Il duello è chiuso.';
var DUEL_IS_OPEN = false;
var FILE_VOTI = "VOTI-data.txt";

//provo a leggere dal file dei voti per boostrappare i dati
VOTI =  {
	aperto: DUEL_IS_OPEN,
	giuria: { a: 0, b: 0 },
	pubblico: { a: 0, b: 0 },
};
try {
	VOTI = JSON.parse(fs.readFileSync(FILE_VOTI));
}
catch (e) {console.log("File dei voti", FILE_VOTI, "non trovato");}

//using
app.use(function(req, res, next){ //on each request coming to our server...
	VOTI.aperto = DUEL_IS_OPEN;
	fs.writeFile(FILE_VOTI, JSON.stringify(VOTI), function (err) {
		if (err) throw err;
	});
	next(); //and move on...
});

var auth = express.basicAuth(function(user, pass, callback) {
	var result = (user === 'testUser' && pass === 'testPass');
	callback(null /* error */, result);
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
	res.render('index', { 
		_ : underscore,
		messaggio: vota('a'),
		risultati: null,
		DUEL_IS_OPEN: DUEL_IS_OPEN,
		VOTI: VOTI
	});
});
app.get('/vota2', function(req, res) {
	res.render('index', { 
		_ : underscore,
		messaggio: vota('b'),
		risultati: null,
		DUEL_IS_OPEN: DUEL_IS_OPEN,
		VOTI: VOTI
	});
});

app.get('/risultati', function(req, res) {
	res.send(JSON.stringify(VOTI));
});

app.get('/open', auth, function(req, res) {
	DUEL_IS_OPEN = true;
	res.redirect("/");
})

app.get('/close', auth, function(req, res) {
	DUEL_IS_OPEN = false;
	res.redirect("/");
})

app.get('/protected', auth, function (req, res) {
	res.render('protected', {
		_ : underscore,
		messaggio: vota('b'),
		risultati: null,
		DUEL_IS_OPEN: DUEL_IS_OPEN,
		VOTI: VOTI
	});
})

//utility
function vota(candidato, giuria) {
	if (!DUEL_IS_OPEN) return LABEL_DUELLO_CHIUSO;
	var messaggio = 'Hai votato: ';
	if(giuria==true && candidato) {
		VOTI.giuria[candidato] = VOTI.giuria[candidato] +1;
	}
	else {
		VOTI.pubblico[candidato] = VOTI.pubblico[candidato] +1;
	}
	return messaggio + candidato;
} 


//start
app.listen(options.port);
console.log('http://localhost:'+options.port);