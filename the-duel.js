//imports
	var argv = require('optimist').argv;
	var express = require('express');
	var ejs = require('ejs');
	var _ = underscore = require('underscore');
	var fs = require('fs');
	var dateformat = require('dateformat');


//command line parameters
	var options = {
		port: process.env.PORT||8000
	};
	if (argv.p) options.port = argv.p;
	if (argv.port) options.port = argv.port;


//app server
	this.app = app = express();
	app.configure(function() {
		app.set('views', __dirname+"/views/"); //folder of the compiled views
		app.use(express.static(__dirname + "/static/")); //static folder, call it as the root
		app.set('view engine', 'ejs');
		app.set("view options", {layout: false});
		app.engine('html', require('ejs').renderFile);
		app.use(express.bodyParser());
		app.use(express.cookieParser('this is a very long hash. Please forget it! ok? :E'));
		app.use(express.session({
			key: 'the-duel',
			secret: 'this is a very long hash. Please forget it! ok? :E'
		}));
	});
	app.engine('html', require('ejs').renderFile);


//costanti
	var LABEL_DUELLO_CHIUSO = 'Il duello è chiuso.';
	var DUEL_IS_OPEN = false;
	var FILE_VOTI = "VOTI-data.txt";


//inizializzo di dati
	var VOTI = {
		aperto: DUEL_IS_OPEN,
		giuria: { a: 0, b: 0 },
		pubblico: { a: 0, b: 0 },
		messaggiGiuria: [

		]
	};
	//provo a leggere il file dei dati salvati
	try { VOTI = JSON.parse(fs.readFileSync(FILE_VOTI)); }
	catch (e) { console.log("File dei voti", FILE_VOTI, "non trovato"); }


//funzione di controllo per autenticazione
	var auth = express.basicAuth(function(user, pass, callback) {
		var result = (user === (process.env.THEDUEL_USERNAME||'user') && pass === (process.env.THEDUEL_PASSWORD||'pass'));
		callback(null /* error */, result);
	});


//utility
	var vota = function(candidato, giuria, voto) {
		if (!DUEL_IS_OPEN) return LABEL_DUELLO_CHIUSO;
		var messaggio = 'Hai votato: ';
		if(giuria==true && candidato) {
			if (voto) { voto = new Number(voto) } else { voto = 1; }
			VOTI.giuria[candidato] = VOTI.giuria[candidato] + voto;
		}
		else {
			VOTI.pubblico[candidato] = VOTI.pubblico[candidato] +1;
		}
		return messaggio + candidato;
	};

	var login = function(req, res, callback) { //mette in sessione l'utente
		req.session.user = process.env.THEDUEL_USERNAME||'user';
		callback();
	};

	var logout = function(req, res, callback) { //mette in sessione l'utente
		if (req.session.user) { delete req.session.user; }
		callback();
	};


//using
	app.use(function(req, res, next){ //on each request coming to our server...
		VOTI.aperto = DUEL_IS_OPEN;
		fs.writeFile(FILE_VOTI, JSON.stringify(VOTI), function (err) {
			//if (err) throw err;
		});
		next(); //and move on...
	});


//routing
	app.get('/', function(req, res) {
		res.render('index', { 
			session: req.session,
			_ : underscore,
			messaggio: null,
			risultati: null,
			DUEL_IS_OPEN: DUEL_IS_OPEN,
			VOTI: VOTI,
			dateformat: dateformat
		});
	});

	app.get('/vota1', function(req, res) {
		res.render('index', { 
			session: req.session,
			_ : underscore,
			messaggio: vota('a'),
			risultati: null,
			DUEL_IS_OPEN: DUEL_IS_OPEN,
			VOTI: VOTI,
			dateformat: dateformat
		});
	});

	app.get('/vota2', function(req, res) {
		res.render('index', { 
			session: req.session,
			_ : underscore,
			messaggio: vota('b'),
			risultati: null,
			DUEL_IS_OPEN: DUEL_IS_OPEN,
			VOTI: VOTI,
			dateformat: dateformat
		});
	});
	
	app.get('/risultati', function(req, res) {
		res.send(JSON.stringify(VOTI));
	});

	app.get('/open', auth, login, function(req, res) {
		DUEL_IS_OPEN = true;
		res.redirect("/");
	});

	app.get('/close', auth, login, function(req, res) {
		DUEL_IS_OPEN = false;
		res.redirect("/");
	});

	app.get('/protected', auth, login, function (req, res) {
		res.render('protected', {
			session: req.session,
			_ : underscore,
			messaggio: vota('b'),
			risultati: null,
			DUEL_IS_OPEN: DUEL_IS_OPEN,
			VOTI: VOTI,
			dateformat: dateformat
		});
	});

	app.post('/voto-giurato', auth, login, function (req, res) {
		if(req.body.candidato && req.body.voto) {
			vota(req.body.candidato, true, req.body.voto);
			VOTI.messaggiGiuria.push({
				data: new Date(), 
				voto: req.body.voto||1, 
				candidato: req.body.candidato,
				messaggio: req.body.messaggio
			});
		}
		res.redirect('/');
	});

	app.get('/login', auth, login, function (req, res) {
		res.redirect('/');
	});

	app.all('/logout', logout, function (req, res) {
		res.redirect('/');
	});


//start
	app.listen(options.port);
	console.log('http://localhost:'+options.port);