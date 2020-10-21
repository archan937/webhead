import cheerio from 'cheerio';
import fs from 'fs-extra';
import nodeLibcurl from 'node-libcurl';
import param from 'jquery-param';
import toughCookie from 'tough-cookie';

const { CookieJar } = toughCookie;
const { curly } = nodeLibcurl;

const Webhead = (opts) => {
  const { jarFile, userAgent, verbose } = opts || {};

  let
    cookieJar,
    webhead = {},

    request = async (method, url, options) => {
      method = method.toUpperCase();
      url = toURL(url);
      options = options || {};

      const { response, redirect } = await curl(method, url, options);

      if (redirect) {
        return request(redirect.method, redirect.url, redirect.options);
      }

      webhead.url = url;
      webhead.cookie = getCookie(url);
      webhead.$ = loadjQuery(response);
      webhead.response = response;

      return response;
    },

    curl = async (method, url, options) => {
      const
        cookieUrl = toCookieUrl(url),
        { curl, opts } = toCurlArgs(method, url, options);

      if (verbose) {
        console.debug(method, curl, opts);
      }

      const response = await curly[method.toLowerCase()](curl, opts);
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
          delete redirect.options.data;
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
      if (webhead.url && url.match(/^\//)) {
        url = webhead.url.origin + url;
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

    toCurlArgs = (method, url, { headers, data }) => {
      let curl = url.href;

      const
        opts = {},
        cookie = getCookie(url);

      headers = toHeaders(headers);
      headers['Host'] = url.host;

      if (cookie.length) {
        headers['Cookie'] = cookie;
      }

      if (!headers['User-Agent'] && userAgent) {
        headers['User-Agent'] = userAgent;
      }

      if (data) {
        data = param(data);
        if (method == 'GET') {
          curl += (curl.match(/\?/) ? '&' : '?') + data;
        } else {
          opts.postFields = data;
        }
        if (!headers['Content-Type']) {
          headers['Content-Type'] = 'application/x-www-form-urlencoded';
        }
      }

      opts.httpHeader = Object.entries(headers).map(
        header => header.join(': ')
      );

      return { curl, opts };
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
    webhead[method] = async (...args) => await request(method, ...args);
  });

  webhead.submit = async (selector, data, options) => {
    const form = webhead.$(selector);
    if (form.length) {
      const
        url = form.attr('action'),
        method = form.attr('method') || 'GET';

      data = Object.assign(
        form.serializeArray().reduce(
          (data, { name, value }) => {
            data[name] = value;
            return data;
          },
          {}
        ),
        data || {}
      );

      return await request(
        method,
        url,
        { ...options, data }
      );
    }
  };

  webhead.text = () => {
    return webhead.response.data;
  };

  webhead.json = () => {
    if (webhead.response.data && webhead.response.headers['Content-Type'].toString().match('json')) {
      return JSON.parse(webhead.response.data);
    }
  };

  if (fs.pathExistsSync(jarFile)) {
    cookieJar = CookieJar.fromJSON({ cookies: fs.readJsonSync(jarFile) });
  } else {
    cookieJar = new CookieJar();
  }

  return webhead;
};

export default Webhead;
