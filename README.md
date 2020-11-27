# Webhead

An easy-to-use Node web crawler storing cookies, following redirects, traversing pages and submitting forms.

## Installation

To use Webhead in your project, run:

  ```shell
  npm install webhead -s
  # or "yarn add webhead"
  ```

## DISCLAIMER

Webhead is **NOT** a browser as it executes HTTP(s) using [node-fetch](https://www.npmjs.com/package/node-fetch) under the hood, [Cheerio](https://cheerio.js.org/) for traversing HTML (or XML) pages and [tough-cookie](https://www.npmjs.com/package/tough-cookie) for managing cookies. Ease in usability of crawling pages, submitting forms, talking to APIs (file uploads included) is the main goal of Webhead.

## Usage

Using Webhead is pretty much straightforward:

  ```javascript
  import Webhead from 'webhead';

  (async () => {

    const webhead = Webhead();

    await webhead.get('https://www.bing.com');
    await webhead.submit('form#sb_form', {
      q: 'paul engel archan937'
    });

    console.log('Bing search results:')

    webhead.$('#b_results h2 a').each((i, el) => {
      el = webhead.$(el);
      console.log('*', el.text())
      console.log(' ', el.attr('href'));
    });

  })();
  ```

See also the [Github login example](https://github.com/archan937/webhead/blob/master/examples/github.js).

### Initializing a Webhead instance

As in the initial example, initializing a Webhead instance is done by invoking the `Webhead()` function.

It supports the following options:

  * `jarFile` - The path at which cookies should be loaded from and stored to.
  * `userAgent` - The `User-Agent` header which will be send to the receiving server.
  * `verbose` - Prints out debug information when sending requests.
  * `beforeSend` - A callback function which will be able to adjust every request before being send.
  * `complete` - A callback function which will be invoked after every request has been completed.

An example using all of the available options:

  ```javascript
  const webhead = Webhead({
    jarFile: 'some/directory/cookies.json',
    userAgent: 'peter-parker/1.0',
    verbose: true,
    beforeSend: ({ method, url, options }, { someToken }) => {
      if ((method != 'GET') && someToken) {
        options.headers['X-Some-Token'] = someToken;
      }
      return { method, url, options };
    },
    complete: (parameters, session, webhead) => {
      if (!session.someToken) {
        const token = webhead.$('meta[name="some-token"]');
        if (token.length) {
          session.someToken = token.attr('content');
        }
      }
    }
  });
  ```

### Cookies and redirects

Webhead handles cookies and redirects as expected when using an actual browser.

### Using the Webhead instance

The Webhead instance provides the following functions:

  * `get` - Sends a `GET` request.
  * `post` - Sends a `POST` request.
  * `put` - Sends a `PUT` request.
  * `patch` - Sends a `PATCH` request.
  * `delete` - Sends a `DELETE` request.
  * `head` - Sends a `HEAD` request.
  * `options` - Sends an `OPTIONS` request.
  * `text` - Returns the body of the response of the last request.
  * `json` - Returns the JSON parsed object based on the last response.
  * `$` - Returns a Cheerio instance based on the last response
  (supports both `text/html` and `text/xml`).
  * `submit` - Submits a form which located in the HTML of the last response.

#### Request payloads

The Webhead request options are as follows:

  * `headers` - An object containing headers for the request (`{"Content-Type": "application/json" }` for instance).
  * `data` - An object containing either query string parameters (for `GET` requests) or the request body (for `POST`, `PUT`, etc) with the straightforward `{name: "value"}` format.
  * `multiPartData` - An array containing multi-part form data.
  * `json` - An object which will be send as JSON request payload.

  ```javascript
  // GET request
  await webhead.get('https://daily-bugle.com/super-heroes');
  await webhead.get('https://daily-bugle.com/super-heroes', {
    headers: {
      'X-Men-Token': 'M4rv3L'
    }
  });

  // POST request with content type 'application/x-www-form-urlencoded'
  await webhead.post('https://daily-bugle.com/super-heroes', {
    data: {
      name: 'Ben Reilly',
      alterEgo: 'Scarlet Spider'
    }
  });

  // PUT request with content type 'multipart/form-data'
  await webhead.put('https://daily-bugle.com/villains', {
    multiPartData: [
      { name: 'thumbnail', file: './thumbnails/venom.jpg' }, // 'type' is optional
      { name: 'name', contents: 'Venom' },
      { name: 'alterEgo', value: 'Eddie Brock' } // 'value' is an alias for 'contents'
    ]
  });

  // POST request with content type 'application/json'
  await webhead.post('https://daily-bugle.com/profile.json', {
    json: {
      firstName: 'Peter',
      lastName: 'Parker',
      isWebhead: true
    }
  });
  ```

#### Traversing

With `webhead.$('CSS selector')` you can traverse the HTML / XML page. See the [Cheerio documentation page](https://cheerio.js.org) for more information.

  ```javascript
  const
    username = webhead.$('summary img').attr('alt'),
    email = webhead.$('[name="user[profile_email]"]').val();

  console.log(`Hello, ${username}! <${email}>`);
  ```

#### Submitting a form

A `webhead` instance provides the `submit()` function for submitting forms on a page. It accepts the following arguments:

  * `selector` - A string matching the form using [CSS selectors](https://www.w3schools.com/cssref/css_selectors.asp).
  * `data` - An object containing form data (`{name: "value"}` format).

  ```javascript
  await webhead.submit('form[name="login"]', {
    login: "peter@dailybugle.com",
    password: "I4m.Spider-Man!"
  });
  ```

## Contact me

For support, remarks and requests, please mail me at [pm_engel@icloud.com](mailto:pm_engel@icloud.com).

## License

Copyright (c) 2020 Paul Engel, released under the MIT license

[http://github.com/archan937](http://github.com/archan937) - [http://twitter.com/archan937](http://twitter.com/archan937) - [pm_engel@icloud.com](mailto:pm_engel@icloud.com)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
