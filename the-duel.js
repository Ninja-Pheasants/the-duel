//imports
	var argv = require('optimist').argv;
	var express = require('express');
	var ejs = require('ejs');
	var _ = underscore = require('underscore');
	var fs = require('fs');
	var dateformat = require('dateformat');
	var pg = require('pg');
	var twitterAPI = require('node-twitter-api');


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
	var VOTI = {};
	var LABEL_DUELLO_CHIUSO = 'Il duello è chiuso.';
	var DUEL_IS_OPEN = false;
	//var FILE_VOTI = "./.profile.d/VOTI-data.txt";
	var CANDIDATI = {
		a: process.env.CANDIDATO_A||'Travaglio',
		b: process.env.CANDIDATO_B||'Grasso'
	}
	var POSTGRES =  {
		CONNECTION_STRING: "postgres://" + process.env.THEDUEL_PG_USER +":"+ process.env.THEDUEL_PG_PASS + "@" + process.env.THEDUEL_PG_HOST +":"+ process.env.THEDUEL_PG_PORT + "/"+process.env.THEDUEL_PG_DB,
		update: 'update "the-duel" set "data" = $1',
		select: 'SELECT  * from "the-duel" limit 1',
		truncate: 'DELETE from "the-duel"'
	};
	var twitter = new twitterAPI({
		consumerKey: process.env.THEDUEL_TW_consumerKey||'null',
		consumerSecret: process.env.THEDUEL_TW_consumerSecret||'null',
		callback: process.env.THEDUEL_TW_callback||'null'
	});

	var TWITTER_ACCESS_TOKEN = process.env.THEDUEL_TW_accessToken||'null';
	var TWITTER_ACCESS_TOKEN_SECRET = process.env.THEDUEL_TW_accessTokenSecret||'null';

//funzione di controllo per autenticazione
	var auth = express.basicAuth(function(user, pass, callback) {
		var result = (user === (process.env.THEDUEL_USER||'user') && pass === (process.env.THEDUEL_PASS||'pass'));
		callback(null /* error */, result);
	});


//utility
	var initData = function(data) {
		VOTI = {
			aperto: false,
			giuria: { a: 0, b: 0 },
			pubblico: { a: 0, b: 0 },
			messaggiGiuria: [

			]
		};
		try { 
			//VOTI_dal_file = JSON.parse(fs.readFileSync(FILE_VOTI)); 
			VOTI = _.extend(VOTI, data);
			DUEL_IS_OPEN = VOTI.aperto;
		}
		catch (e) { 
			//console.log("File dei voti", FILE_VOTI, "non trovato"); 
		}
	};
	var detectmobilebrowser = function(UAstring) {
		var UAstring = UAstring.toLowerCase();
		return (
			/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(UAstring)
			||
			/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(UAstring.substr(0,4))
		);
	};

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
		return messaggio + CANDIDATI[candidato];
	};

	var login = function(req, res, callback) { //mette in sessione l'utente
		req.session.user = process.env.THEDUEL_USER||'user';
		callback();
	};

	var logout = function(req, res, callback) { //mette in sessione l'utente
		if (req.session.user) { delete req.session.user; }
		callback();
	};

	var defaultLocals = function(req, messaggio) { //restituisce oggetti da renderizzare nelle view comuni a tutte le richieste
		return {
			clientIsMobile: detectmobilebrowser(req.headers['user-agent']),
			messaggio: messaggio||null,
			_: underscore,
			dateformat: dateformat,
			session: req.session,
			DUEL_IS_OPEN: DUEL_IS_OPEN,
			VOTI: VOTI,
			CANDIDATI: CANDIDATI,
			queryString: req.query
		};
	};

//using
	app.use(function(req, res, next){ //on each request coming to our server...
		VOTI.aperto = DUEL_IS_OPEN;
		/*fs.writeFile(FILE_VOTI, JSON.stringify(VOTI), function (err) {
			//if (err) throw err;
		});*/
		pg.connect(POSTGRES.CONNECTION_STRING, function(err, client, done) {
			if (err) { console.log("err pg.connect", err); }
			//console.log("client pg.connect", client);
			if (!err && client) {
				//count users
				client.query(POSTGRES.update, [JSON.stringify(VOTI)], function(err, result) {
					if (err) { console.log("err client", err); }
					//done(result.rows[0]||null);
					done();
					next(); //and move on...
				});
			}
		});
	});


//routing
	app.get('/', function(req, res) {
		res.render('index', defaultLocals(req));
		req.session.messaggio = null;
	});

	app.get('/votaA', function(req, res) {
		req.session.messaggio = vota('a');
		res.redirect("/");
	});

	app.get('/votaB', function(req, res) {
		req.session.messaggio = vota('b');
		res.redirect("/");
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
		res.render('index', defaultLocals(req, messaggioVoto));
	});

	app.post('/voto-giurato', auth, login, function (req, res) {
		if(req.body.candidato && req.body.voto) {
			vota(req.body.candidato, true, req.body.voto);
			if(req.body.messaggio) {
				var voto = req.body.voto||1;
				var candidato = req.body.candidato;
				var messaggio = req.body.messaggio;
				var hashtag = req.body.hashtag||'';
				VOTI.messaggiGiuria.push({
					data: new Date(), 
					voto: voto, 
					candidato: candidato,
					messaggio: messaggio,
					hashtag: hashtag
				});
				
				var twitterStatus = "+" +voto+ " " +CANDIDATI[candidato]+ ": "+messaggio+" "+hashtag;
 				twitter.statuses('update', {status: twitterStatus}, TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_TOKEN_SECRET, function(err, data, resp){
					//hoping no error!
				});
			}
		}
		res.redirect('/');
	});

	app.get('/reset', auth, login, function (req, res) {
		VOTI = {
			aperto: false,
			giuria: { a: 0, b: 0 },
			pubblico: { a: 0, b: 0 },
			messaggiGiuria: []
		};
		res.redirect('/');
	});

	app.get('/login', auth, login, function (req, res) {
		res.redirect('/');
	});

	app.all('/logout', logout, function (req, res) {
		res.redirect('/');
	});


//start
	pg.connect(POSTGRES.CONNECTION_STRING, function(err, client, done) {
		if (err) { console.log("err pg.connect", err); }
		//console.log("client pg.connect", client);
		if (!err && client) {
			//count users
			client.query(POSTGRES.select, function(err, result) {
				var data ={};
				if (err) { console.log("err client", err); }
				if (result) { if (result.rows[0]) { data = JSON.parse(result.rows[0].data); } }
				initData(data);
				app.listen(options.port);
				console.log("the-duel started: http://localhost:"+options.port+"/");
				done();
			});
		}
	});
