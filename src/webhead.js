import cheerio from 'cheerio';
import fs from 'fs-extra';
import nodeLibcurl from 'node-libcurl';
import param from 'jquery-param';
import toughCookie from 'tough-cookie';

const { CookieJar } = toughCookie;
const { curly } = nodeLibcurl;

const Webhead = (opts) => {
  const { jarFile, userAgent, verbose, beforeSend, complete } = opts || {};

  let
    cookieJar,
    webhead = {},
    session = {},

    request = async (method, url, options) => {
      let parameters = {
        method: method.toUpperCase(),
        url: toURL(url),
        options: toOptions(options)
      };

      if (beforeSend) {
        parameters = beforeSend(parameters, session);
        parameters.method = parameters.method.toUpperCase();
        parameters.url = toURL(parameters.url);
        parameters.options = toOptions(parameters.options);
      }

      const { response, redirect } = await curl(parameters);

      if (redirect) {
        return request(redirect.method, redirect.url, redirect.options);
      }

      webhead.url = parameters.url;
      webhead.cookie = getCookie(webhead.url.href);
      webhead.$ = loadjQuery(response);
      webhead.response = response;

      if (complete) {
        complete(parameters, session, webhead);
      }

      return response;
    },

    toURL = (url) => {
      if (url.constructor == URL) {
        url = url.href;
      }
      if (webhead.url && url.match(/^\//)) {
        url = webhead.url.origin + url;
      }
      return new URL(url);
    },

    toOptions = (object) => {
      object || (object = {});
      object.headers = toHeaders(object.headers);
      return object;
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

    curl = async ({ method, url, options }) => {
      let { headers, data } = options;

      headers['Host'] = url.host;
      url = url.href;

      const
        cookie = getCookie(url),
        opts = {};

      if (cookie.length) {
        headers['Cookie'] = cookie;
      }

      if (!headers['User-Agent'] && userAgent) {
        headers['User-Agent'] = userAgent;
      }

      if (data) {
        if (!headers['Content-Type']) {
          headers['Content-Type'] = 'application/x-www-form-urlencoded';
        }
        data = param(data);
        if (method == 'GET') {
          url += (url.match(/\?/) ? '&' : '?') + data;
        } else {
          opts.postFields = data;
        }
      }

      opts.post = (method == 'POST');
      opts.nobody = (method == 'HEAD');

      if (!method.match(/(GET|HEAD|POST)/)) {
        opts.customRequest = method;
      }

      opts.httpHeader = Object.entries(headers).map(
        header => header.join(': ')
      );

      verbose && console.log(method, url, options);
      let response = await curly(url, opts);

      return handleResponse(method, url, options, response);
    },

    handleResponse = (method, url, options, { statusCode, data, headers }) => {
      headers = toHeaders(headers[0]);
      verbose && console.log({ statusCode, data, headers });

      if (headers['Set-Cookie']) {
        const cookieUrl = toCookieUrl(url);

        headers['Set-Cookie'].forEach((cookie) => {
          cookieJar.setCookieSync(cookie, cookieUrl);
        });

        if (jarFile) {
          const cookies = cookieJar.toJSON().cookies;
          fs.writeFileSync(jarFile, JSON.stringify(cookies, null, 2));
        }
      }

      let redirect;

      if (/^3/.test('' + statusCode)) {
        redirect = {
          method,
          url: headers['Location'],
          options
        };
        if (statusCode <= 303) {
          redirect.method = 'GET';
          delete redirect.options.data;
        }
      }

      return {
        response: { statusCode, data, headers },
        redirect
      };
    },

    toCookieUrl = (url) => url.replace(/\?.*/, ''),

    getCookie = (url) => cookieJar.getCookiesSync(toCookieUrl(url)).join('; '),

    loadjQuery = ({ statusCode, headers, data }) => {
      if (/^2/.test('' + statusCode)) {
        const contentType = '' + headers['Content-Type'];
        if (contentType.match('html')) {
          return cheerio.load(data);
        }
        if (contentType.match('xml')) {
          return cheerio.load(data, { xmlMode: true });
        }
      }
    };

  `get post put patch delete head options`.split(' ').forEach(method => {
    webhead[method] = async (...parameters) => await request(method, ...parameters);
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
    if (webhead.response) {
      return webhead.response.data;
    }
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
