var PocketSphinx = require('../'),
	express = require('express'),
	socket_io = require('socket.io'),
	http = require('http');

var app = express();

app.use(function(req, res) {
	return res.status(200).sendFile('index.html', { root: __dirname + "/public" });
});


var server = http.Server(app),
	io = socket_io(server);

io.on('connection', function(socket) {

	// The values need to be added with the correct type 
	// e.g.: -hmm as String, -nfft as Integet, -wbeam as Float and -remove_silence as Boolean
	var sphinx = new PocketSphinx.Recognizer({
		'-nfft': 2048
	}, function(err, hypothesis, score) {
		if(err) console.error(err);
		socket.emit('utterance', { phrase: hypothesis, score: score });
	});

	sphinx.addGrammarSearch('digits', __dirname + '/digits.gram');
	sphinx.search = 'digits';

	sphinx.start();

	socket.emit('ready');

	socket.on('audio', function(data) {
		var resampled = sphinx.fromFloat(data);
		sphinx.writeSync(resampled);
	});

	socket.on('restart', function() {
		sphinx.restart();
	});

	socket.on('error', function(error) {
		console.error('An error occured', error);
	});
});

server.listen(process.env.port || 3000, function() {
	console.log('Listening on port %d', process.env.port || 3000);
});