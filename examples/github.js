import prompts from 'prompts';
import Webhead from '../src/webhead.js';

(async () => {

  const webhead = Webhead({
    jarFile: 'examples/cookies.json',
    verbose: true
  });

  await webhead.get('https://github.com/settings/profile');

  if (webhead.text().match('Sign in to GitHub')) {
    const { login, password } = await prompts([
      {
        type: 'text',
        name: 'login',
        message: 'Fill in your username or e-mail address'
      },
      {
        type: 'password',
        name: 'password',
        message: 'Fill in your password',
      },
    ]);
    await webhead.submit('form', {
      login,
      password
    });
  }

  if (webhead.url.pathname == '/sessions/verified-device') {
    const { otp } = await prompts([
      {
        type: 'text',
        name: 'otp',
        message: 'Fill in your verification code (please check your mail)',
      },
    ]);
    await webhead.submit('form', {
      otp
    });
  }

  const
    username = webhead.$('summary img').attr('alt'),
    email = webhead.$('[name="user[profile_email]"]').val();

  console.log(`Hello, ${username}! <${email}>`);

})();
