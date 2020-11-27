const Webhead = require('../dist/webhead.js');

(async () => {

  const webhead = Webhead();
  await webhead.get('https://jsonplaceholder.typicode.com/posts');
  console.log(webhead.json());

})();
