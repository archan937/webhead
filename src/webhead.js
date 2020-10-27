import cheerio from 'cheerio';
import fs from 'fs-extra';
import mime from 'mime-types';
import nodeLibcurl from 'node-libcurl';
import param from 'jquery-param';
import toughCookie from 'tough-cookie';

const { CookieJar } = toughCookie;
const { curly } = nodeLibcurl;

const Webhead = (opts) => {
  const { jarFile, userAgent, verbose, beforeSend, complete } = opts || {};

  let
    webhead = {},
    session = {},
    cookieJar,
    cachedCheerio,
    cachedJSON,

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
      let { headers, data, multiPartData, json } = options;

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
          opts.post = true;
          opts.postFields = data;
        }
      }

      if (multiPartData) {
        opts.httpPost = multiPartData.map((data) => {
          if (data.value) {
            data.contents = data.value;
            delete data.value;
          }
          if (data.file && !data.type) {
            const type = mime.lookup(data.file);
            type && (data.type = type);
          }
          return data;
        });
      }

      if (json) {
        headers['Content-Type'] = 'application/json';
        opts.post = true;
        opts.postFields = JSON.stringify(json);
      }

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
          options
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
        redirect
      };
    },

    toCookieUrl = (url) => {
      return url.replace(/\?.*/, '')
    },

    getCookie = (url) => {
      return cookieJar.getCookiesSync(toCookieUrl(url)).join('; ')
    };

  `get post put patch delete head options`.split(' ').forEach(method => {
    webhead[method] = async (...parameters) => await request(method, ...parameters);
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
    return cachedCheerio ? cachedCheerio(...args) : undefined;
  };

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

  if (fs.pathExistsSync(jarFile)) {
    const
      json = fs.readJsonSync(jarFile),
      cookies = json.cookies || json;

    cookieJar = CookieJar.fromJSON({
      cookies: (cookies.constructor == Array) ? cookies : []
    });

  } else {
    cookieJar = new CookieJar();
  }

  return webhead;
};

export default Webhead;
