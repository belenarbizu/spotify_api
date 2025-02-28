const express = require('express');
const querystring = require('querystring');
const request = require('request');

const app = express();

const client_id = "40f7a7e19db84ab9b82eb6c6195e6fe4"
const client_secret = "98bba2adaf4f4b788878d8b59ba3247e"
const redirect_uri = "http://127.0.0.1:8888/callback"

function generateRandomString(length) {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < length; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

app.get('/login', function(req, res) {

    var state = generateRandomString(16);
    var scope = 'user-read-private user-read-email';
  
    res.redirect('https://accounts.spotify.com/authorize?' +
      querystring.stringify({
        response_type: 'code',
        client_id: client_id,
        scope: scope,
        redirect_uri: redirect_uri,
        state: state
      }));
  });


app.get('/callback', function(req, res) {

  var code = req.query.code || null;
  var state = req.query.state || null;

  if (state === null) {
    res.redirect('/#' +
      querystring.stringify({
        error: 'state_mismatch'
      }));
  } else {
    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'
      },
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + (new Buffer.from(client_id + ':' + client_secret).toString('base64'))
      },
      json: true
    };

    request.post(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {
        const access_token = body.access_token;
        
        const options = {
          url: 'https://api.spotify.com/v1/me',
          headers: {
            'Authorization': 'Bearer ' + access_token,
          },
          json: true,
        };
        
        request.get(options, function(error, response, body) {
          if (error || response.statusCode !== 200) {
            res.send('Error al obtener información del usuario');
          } else {
            const image = body.images[0].url;
            const name = body.display_name;
            const followers = body.followers.total;
            let HtmlResponse = '<html><body><h1>Your profile</h1><ul>';
            HtmlResponse += '<img src="' + image + '" height="160" width="160"/><br>';
            HtmlResponse += '<h2>Name: ' + name + '</h2>';
            HtmlResponse += '<h4>Followers: ' + followers + '</h4>';
            HtmlResponse += '</ul></body></html>';
            res.send(HtmlResponse);
          }
        });
      } else {
        res.redirect('/#' +
          querystring.stringify({
            error: 'invalid_token'
          }));
      }
    });
  }
});

app.listen(8888, () => {
  console.log('Servidor corriendo en http://127.0.0.1:8888');
});