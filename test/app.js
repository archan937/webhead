const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res
    .send(`
      <html>
        <body>
          <h1>Welcome, follow webhead</h1>
          <p>Enjoy! :)</p>
        </body>
      </html>`);
});

app.get('/newsfeed.json', (req, res) => {
  res
    .json({
      title: 'Webhead is out!',
      description: 'An easy-to-use Node web crawler'
    });
});

app.get('/plain-text', (req, res) => {
  res
    .set('Content-Type', 'text/plain')
    .send('Plain text!');
});

module.exports = app;
