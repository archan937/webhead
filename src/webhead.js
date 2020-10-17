import cheerio from 'cheerio';
import fs from 'fs-extra';
import nodeLibcurl from 'node-libcurl';
import querystring from 'querystring';
import toughCookie from 'tough-cookie';

const { CookieJar } = toughCookie;
const { curly } = nodeLibcurl;

const Webhead = (opts) => {
  const { verbose, jarFile } = opts || {};

  let
    cookieJar,
    state = {},

    request = async (method, url, options) => {
      method = method.toLowerCase();
      url = toURL(url);
      options = options || {};

      const { response, redirect } = await curl(method, url, options);

      if (redirect) {
        return request(redirect.method, redirect.url, redirect.options);
      }

      state.url = url;
      state.cookie = getCookie(url);
      state.$ = loadjQuery(response);
      state.response = response;

      return response;
    },

    curl = async (method, url, options) => {
      const
        cookieUrl = toCookieUrl(url),
        opts = toCurlOpts(url, options);

      if (verbose) {
        console.debug(method.toUpperCase(), url.href, opts);
      }

      const response = await curly[method](url.href, opts);
      let redirect;

      response.headers = toHeaders(response.headers[0]);

      if (verbose) {
        console.debug(response);
      }

      if (response.headers['Set-Cookie']) {
        response.headers['Set-Cookie'].forEach((cookie) => {
          cookieJar.setCookieSync(cookie, cookieUrl);
        });
        if (jarFile) {
          const cookies = cookieJar.toJSON().cookies;
          fs.writeFileSync(jarFile, JSON.stringify(cookies, null, 2));
        }
      }

      if (/^3/.test('' + response.statusCode)) {
        redirect = {
          method,
          url: response.headers['Location'],
          options
        };
        if (response.statusCode <= 303) {
          redirect.method = 'GET';
          delete redirect.options.formData;
        }
      }

      return {
        response,
        redirect
      };
    },

    getCookie = (url) => cookieJar.getCookiesSync(toCookieUrl(url)).join('; '),
    toCookieUrl = (url) => url.href.replace(/\?.*/, ''),

    toURL = (url) => {
      if (state.url && url.match(/^\//)) {
        url = state.url.origin + url;
      }
      return new URL(url);
    },

    toHeaders = (object) => {
      if (object) {
        return Object.entries(object).reduce(
          (object, [key, value]) => {
            object[key.replace(/\b./g, (c) => c.toUpperCase())] = value;
            return object;
          },
          {}
        );
      } else {
        return {};
      }
    },

    toCurlOpts = (url, { headers, formData }) => {
      const
        opts = {},
        cookie = getCookie(url);

      headers = toHeaders(headers);
      headers['Host'] = url.host;

      if (cookie.length) {
        headers['Cookie'] = cookie;
      }

      opts.httpHeader = Object.entries(headers).map(
        header => header.join(': ')
      );

      if (formData) {
        opts.postFields = querystring.stringify(formData);
      }

      return opts;
    },

    loadjQuery = ({ statusCode, headers, data }) => {
      if (/^2/.test('' + statusCode)) {
        const contentType = headers['Content-Type'];
        if (contentType.match('html')) {
          return cheerio.load(data);
        }
        if (contentType.match('xml')) {
          return cheerio.load(data, { xmlMode: true });
        }
      }
    };

  `get post put delete head patch`.split(' ').forEach(method => {
    state[method] = async (...args) => await request(method, ...args);
  });

  state.submit = async (selector, data) => {
    const form = state.$(selector);
    if (form.length) {
      const
        url = form.attr('action'),
        method = form.attr('method') || 'POST',
        formData = Object.assign(
          form.serializeArray().reduce(
            (formData, { name, value }) => {
              formData[name] = value;
              return formData;
            },
            {}
          ),
          data || {}
        );

      return await request(
        method,
        url,
        { formData }
      );
    }
  };

  state.text = () => {
    return state.response.data;
  };

  state.json = () => {
    if (state.response.data) {
      return JSON.parse(state.response.data);
    }
  };

  if (fs.pathExistsSync(jarFile)) {
    cookieJar = CookieJar.fromJSON({ cookies: fs.readJsonSync(jarFile) });
  } else {
    cookieJar = new CookieJar();
  }

  return state;
};

export default Webhead;