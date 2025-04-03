import express from 'express';
import session from 'express-session';
import { Issuer, generators } from 'openid-client';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const COGNITO_DOMAIN = 'https://ap-southeast-2413r55dhr.auth.ap-southeast-2.amazoncognito.com';
const COGNITO_ISSUER_URL = 'https://cognito-idp.ap-southeast-2.amazonaws.com/ap-southeast-2_413r55dHR';
const CLIENT_ID = '77bkhovrpm1gmfj2a42ba74gan';
const REDIRECT_URI = 'http://localhost:3001/callback';
const CLIENT_SECRET = '1rrb56b0bdr6qj9m60mkio48jj10ed17ng9rudgqvgd0l1k2l5e5';





const app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(session({
  secret: 'test_secret',
  resave: false,
  saveUninitialized: false
}));

let client;

(async () => {
  const issuer = await Issuer.discover(COGNITO_ISSUER_URL);
  client = new issuer.Client({
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    redirect_uris: [REDIRECT_URI],
    response_types: ['code']
  });

  app.get('/', (req, res) => {
    res.render('home', {
      isAuthenticated: !!req.session.userInfo,
      userInfo: req.session.userInfo
    });
  });

  app.get('/login', (req, res) => {
    const nonce = generators.nonce();
    const state = generators.state();
    req.session.nonce = nonce;
    req.session.state = state;

    const url = client.authorizationUrl({
      scope: 'openid email phone',
      nonce,
      state
    });

    res.redirect(url);
  });

  app.get('/callback', async (req, res) => {
    try {
      const params = client.callbackParams(req);
      const tokenSet = await client.callback(REDIRECT_URI, params, {
        nonce: req.session.nonce,
        state: req.session.state
      });

      const userInfo = await client.userinfo(tokenSet.access_token);
      req.session.userInfo = userInfo;
      res.redirect('/');
    } catch (err) {
      console.error('Callback error:', err);
      res.send('Login failed');
    }
  });

  app.get('/logout', (req, res) => {
    req.session.destroy(() => {
      res.redirect(`${COGNITO_DOMAIN}/logout?client_id=${CLIENT_ID}&logout_uri=http://localhost:3001`);
    });
  });

  const viewsPath = path.join(__dirname, 'views');
  if (!fs.existsSync(viewsPath)) fs.mkdirSync(viewsPath);

  fs.writeFileSync(path.join(viewsPath, 'home.ejs'), `
    <!DOCTYPE html>
    <html>
    <head><title>Amazon Cognito Auth</title></head>
    <body>
      <h1>Amazon Cognito Test</h1>
      <% if (isAuthenticated) { %>
        <h2>Welcome, <%= userInfo.email || userInfo.username %></h2>
        <pre><%= JSON.stringify(userInfo, null, 2) %></pre>
        <a href="/logout">Logout</a>
      <% } else { %>
        <p>You are not logged in.</p>
        <a href="/login">Login</a>
      <% } %>
    </body>
    </html>
  `);

  app.listen(3001, () => {
    console.log(' Cognito test server running at http://localhost:3001');
  });
})();
