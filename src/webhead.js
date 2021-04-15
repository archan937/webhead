import cheerio from 'cheerio';
import FormData from 'form-data';
import fs from 'fs-extra';
import nodeFetch from 'node-fetch';
import param from 'jquery-param';
import toughCookie from 'tough-cookie';

const { CookieJar } = toughCookie;

const Webhead = (opts) => {
  const { jarFile, userAgent, verbose, beforeSend, complete } = opts || {};

  let webhead = {},
    session = {},
    cookieJar,
    cachedCheerio,
    cachedJSON,
    request = async (method, url, options) => {
      let parameters = {
        method: method.toUpperCase(),
        url: toURL(url),
        options: toOptions(options),
      };

      if (beforeSend) {
        parameters = beforeSend(parameters, session);
        parameters.method = parameters.method.toUpperCase();
        parameters.url = toURL(parameters.url);
        parameters.options = toOptions(parameters.options);
      }

      const { response, redirect } = await fetch(parameters);

      if (redirect) {
        return request(redirect.method, redirect.url, redirect.options);
      }

      webhead.url = parameters.url;
      webhead.cookie = getCookie(webhead.url.href);
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
      return new URL(url, webhead.url);
    },
    toOptions = (object) => {
      object || (object = {});
      object.headers = toHeaders(object.headers);
      return object;
    },
    toHeaders = (object) => {
      if (object) {
        return Object.entries(object).reduce((object, [key, value]) => {
          if (key.toLowerCase() != 'set-cookie' && Array.isArray(value)) {
            value = value.join('; ');
          }
          object[key.replace(/\b./g, (c) => c.toUpperCase())] = value;
          return object;
        }, {});
      } else {
        return {};
      }
    },
    fetch = async ({ method, url, options }) => {
      let { headers, data, multiPartData, json } = options;

      const cookie = getCookie(url.href),
        opts = {
          method,
          headers: Object.assign({}, headers),
          redirect: 'manual',
        };

      opts.headers['Host'] = url.host;
      url = url.href;

      if (cookie.length) {
        opts.headers['Cookie'] = cookie;
      }

      if (!opts.headers['User-Agent'] && userAgent) {
        opts.headers['User-Agent'] = userAgent;
      }

      if (data) {
        if (method == 'GET') {
          url += (url.match(/\?/) ? '&' : '?') + param(data);
        } else {
          if (!opts.headers['Content-Type']) {
            opts.headers['Content-Type'] = 'application/x-www-form-urlencoded';
          }
          opts.body = param(data);
        }
      } else if (multiPartData) {
        const form = new FormData();

        (multiPartData || []).forEach((part) => {
          if (part.file) {
            form.append(part.name, fs.createReadStream(part.file));
          } else {
            form.append(
              part.name,
              part.hasOwnProperty('value') ? part.value : part.contents
            );
          }
        });

        opts.body = form;
        opts.headers = {
          ...opts.headers,
          ...form.getHeaders(),
        };
      }

      if (json) {
        opts.headers['Content-Type'] = 'application/json';
        opts.body = JSON.stringify(json);
      }

      verbose && console.log(method, url, opts);
      let response = await nodeFetch(url, {
        method,
        ...opts,
      });

      return await handleResponse(method, url, options, response);
    },
    handleResponse = async (method, url, options, response) => {
      const statusCode = response.status,
        data = await response.text(),
        headers = toHeaders(response.headers.raw());

      verbose && console.log({ statusCode, data, headers });

      if (headers['Set-Cookie']) {
        const cookieUrl = toCookieUrl(url);

        headers['Set-Cookie'].forEach((cookie) => {
          cookieJar.setCookieSync(cookie, cookieUrl);
        });

        if (jarFile) {
          const cookies = cookieJar.toJSON().cookies;
          let json = {};

          if (fs.pathExistsSync(jarFile)) {
            json = fs.readJsonSync(jarFile);
          }

          if (json.constructor == Object) {
            json.cookies = cookies;
          } else {
            json = cookies;
          }

          fs.writeFileSync(jarFile, JSON.stringify(json, null, 2));
        }
      }

      let redirect;

      if (/^3/.test('' + statusCode)) {
        redirect = {
          method,
          url: headers['Location'],
          options,
        };
        if (statusCode <= 303) {
          redirect.method = 'GET';
          delete redirect.options.data;
        }
      }

      cachedCheerio = undefined;
      cachedJSON = undefined;

      return {
        response: { statusCode, data, headers },
        redirect,
      };
    },
    toCookieUrl = (url) => {
      return url.replace(/\?.*/, '');
    },
    getCookie = (url) => {
      return cookieJar.getCookiesSync(toCookieUrl(url)).join('; ');
    };

  `get post put patch delete head options`.split(' ').forEach((method) => {
    webhead[method] = async (...parameters) =>
      await request(method, ...parameters);
  });

  webhead.text = () => {
    return webhead.response ? webhead.response.data : '';
  };

  webhead.json = () => {
    if (!cachedJSON && webhead.response) {
      const { data, headers } = webhead.response;
      if (data && ('' + headers['Content-Type']).match('json')) {
        cachedJSON = JSON.parse(data);
      }
    }
    return cachedJSON;
  };

  webhead.$ = (...args) => {
    if (!cachedCheerio && webhead.response) {
      const { data, headers } = webhead.response;
      const match = ('' + headers['Content-Type']).match(/(html|xml)/);
      if (match) {
        cachedCheerio = cheerio.load(data, { xmlMode: match[1] == 'xml' });
      }
    }
    return cachedCheerio ? cachedCheerio(...args) : [];
  };

  webhead.submit = async (selector, data, options) => {
    const form = webhead.$(selector);
    if (form.length) {
      const url = form.attr('action'),
        method = form.attr('method') || 'GET';

      data = Object.assign(
        form.serializeArray().reduce((data, { name, value }) => {
          data[name] = value;
          return data;
        }, {}),
        data || {}
      );

      return await request(method, url, { ...options, data });
    }
  };

  webhead.clearCookies = () => {
    cookieJar.removeAllCookiesSync();
  };

  if (fs.pathExistsSync(jarFile)) {
    const json = fs.readJsonSync(jarFile),
      cookies = json.cookies || json;

    cookieJar = CookieJar.fromJSON({
      cookies: cookies.constructor == Array ? cookies : [],
    });
  } else {
    cookieJar = new CookieJar();
  }

  return webhead;
};

export default Webhead;
