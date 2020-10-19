import prompts from 'prompts';
import Webhead from '../src/webhead.js';

(async () => {

  const webhead = Webhead({ verbose: true });
  await webhead.get('https://www.bing.com');

  const { q } = await prompts([
    {
      type: 'text',
      name: 'q',
      message: 'Type in your search query',
    },
  ]);

  await webhead.submit('form#sb_form', { q });
  console.log('Bing search results:')

  webhead.$('#b_results h2 a').each((i, el) => {
    el = webhead.$(el);
    console.log('*', el.text())
    console.log(' ', el.attr('href'));
  });

})();
