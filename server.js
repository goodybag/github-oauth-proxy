var qs = require('querystring');
var url = require('url');
var http = require('http');
var https = require('https');
var config = require('./config.json');
var parseAuth = require('basic-auth-parser');

function getToken(username, password, res) {
  if (typeof username != 'string' || typeof password != string) {
    res.writeHead(400, 'Must supply username and password');
    res.end();
    return;
  }

  var auth = 'Basic ' + (new Buffer(username + ':' + password)).toString('base64');

  var ghreq = https.request({
    hostname:'api.github.com',
    path:'/authorizations',
    method:'POST',
    headers:{
      "Content-Type":"application/json",
      "Accept":"application/json",
      "Authorization":auth
    }
  }, function(ghres){
    var data = '';

    if (ghres.statusCode === 404) {
      res.writeHead(500);
      res.end();
      return;
    }

    ghres.on('data', function(chunk){data += chunk;});
    ghres.on('end', function() {
      var body = JSON.parse(data);
      if (body['error'] != null)
        res.writeHead(400, body['error']);
      else
        res.writeHead(200);

      res.write(data);
      res.setHeader('Content-Type', 'application/json');
      res.end();
    });
  });

  var data = {
    client_id: config.client_id,
    client_secret: config.client_secret,
    scopes: ['repo']
  };

  ghreq.write(JSON.stringify(data));
  ghreq.end();
}

var server = http.createServer(function (req, res) {
  res.setHeader('Allow', 'GET POST');

  var params = url.parse(req.url, true).query;
  var data = '';

  if (['GET', 'POST'].indexOf(req.method) === -1) {
    res.writeHead(405);
    res.end();
    return;
  }

  var lcHeaders = {};
  for (k in req.headers)
    lcHeaders[k.toLowerCase()] = req.headers[k];

  var auth;
  if (lcHeaders['authorization'] != null)
    auth = parseAuth(lcHeaders['authorization']);

  var username, password;

  username = auth['username'];
  password = auth['password'];

  if (params['username'] != null && params['password'] != null) {
    username = params['username'];
    password = params['password'];
  }

  if (req.method === 'POST') {
    req.on('data', function(chunk) {
      data += chunk;
      if (data.length > 1e6) {
        // body too large
        res.writeHead(413);
        req.connection.destroy();
      }
    });

    req.on('end', function(){
      var body = {};
      if (data != '')
        body = lcHeaders['content-type'] === 'application/json' ? JSON.parse(data) : qs.parse(body);

      if (body['username'] != null && body['password'] != null) {
        username = body['username'];
        password = body['password'];
      }

      getToken(username, password, res);
    });
  } else
    getToken(username, password, res);
});

exports.start = function(port) {
  server.listen(port);
  console.log('running on port ' + port);
}

exports.start(80);
