import Webhead from '../src/webhead.js';

(async () => {
  const webhead = Webhead({ verbose: true });
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
