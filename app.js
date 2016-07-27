"use strict";
const http = require('http');
const router = require('router');
const finalhandler = require('finalhandler');
const path = require('path');
const view = require('consolidate');
const app = new router();
const qs = require('querystring');
const shortid = require('shortid');

const level = require('level');
const dbpath = path.resolve('./db');
const db = level(dbpath);

app.use((req, res, next) => {
	res.render = function render(filename, params){
		var file = path.resolve(__dirname + '/views', filename);
		view.mustache(file, params || {}, function(err, html){
			if(err) {return next(err);}
			res.setHeader('Content-Type', 'text/html');
			res.end(html);
		});
	};
	next();
});

// Parse form
app.use((req, res, next) => {
	if(req.methd !== 'POST') {return next();}
	let body = '';
	req.on('data', (buf) =>{
		body = body + buf.toString();
	});

req.on('end', () =>{
	req.body = qs.parse(body);
	next();
})

});

app.use((req, res, next) => {
	res.json = function json(obj){
		res.setHeader('Content-Type', 'application/json');
		res.end(JSON.stringify(obj));
	}
	next();
});

app.get('/:id', (req, res) =>{
	db.get(req.params.id, (err, url) =>{
		res.setHeader('Content-Type', 'text/html');
		if(err){
			res.statusCode = 404;
			res.end('404 not found');
		}
		res.statusCode = 301;
		res.setHeader('Location', url);
		res.end();
	});
});

app.get('/', (req, res) => {
	res.render("home.html", {
		name: 'nguyendan'
	});
});

app.post('', (req, res) => {
	if(!req.body.url){
		return res.render('home.html', {
			mgs: 'url missing'
		});
	}

	let id = shortid.generate();
	db.put(id, req.body.url, (err) => {
		if(err){
			return res.render('home.html', {
				msg: err.toString()
			});
		}

		let url = 'http://localhost:3000/' + id;
		res.render('home.html', {
			msg: `You url ${url}`

		})
	})

})

const server = http.createServer();
server.on('request', (req, res) => {
	app(req, res, finalhandler(req, res));
});
server.listen(process.env.PORT || 3000);