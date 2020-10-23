const app = require('../app.js');
const webhead = require('../../dist/webhead.js')();

let server;

beforeAll(async (done) => {
  server = await app.listen();
  await webhead.get(`http://localhost:${server.address().port}`);
  done();
});

afterAll(async (done) => {
  await server.close(done);
});

describe('GET', () => {
  it('supports HTML pages', async () => {
    await webhead.get('/');
    expect(webhead.text()).toMatch('<h1>Welcome, follow webhead</h1>');
    expect(webhead.$('p').html()).toMatch('Enjoy! :)');
    expect(webhead.json()).toBeUndefined();
  });

  it('supports JSON pages', async () => {
    await webhead.get('/newsfeed.json');
    expect(webhead.text()).toMatch('{"title":"Webhead is out!","description":"An easy-to-use Node web crawler"}');
    expect(webhead.$('*')).toBeUndefined();
    expect(webhead.json()).toStrictEqual({ "description": "An easy-to-use Node web crawler", "title": "Webhead is out!" });
  });

  it('supports plain text pages', async () => {
    await webhead.get('/plain-text');
    expect(webhead.text()).toMatch('Plain text!');
    expect(webhead.$('*')).toBeUndefined();
    expect(webhead.json()).toBeUndefined();
  });
});
