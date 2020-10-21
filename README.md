# Webhead

An easy-to-use web crawler package storing cookies, following redirects, traversing pages and submitting forms.

## Installation

To use Webhead in your project, run:

  ```shell
  npm install webhead -s
  # or "yarn add webhead"
  ```

## Usage

Using Webhead is pretty much straightforward:

  ```javascript
  import Webhead from '../src/webhead.js';

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

## Contact me

For support, remarks and requests, please mail me at [pm_engel@icloud.com](mailto:pm_engel@icloud.com).

## License

Copyright (c) 2020 Paul Engel, released under the MIT license

[http://github.com/archan937](http://github.com/archan937) - [http://twitter.com/archan937](http://twitter.com/archan937) - [pm_engel@icloud.com](mailto:pm_engel@icloud.com)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
