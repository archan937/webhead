function e(e){return e&&"object"==typeof e&&"default"in e?e.default:e}var r=e(require("axios")),t=e(require("cheerio")),o=e(require("form-data")),n=e(require("fs-extra")),a=e(require("jquery-param"));function s(){return(s=Object.assign||function(e){for(var r=1;r<arguments.length;r++){var t=arguments[r];for(var o in t)Object.prototype.hasOwnProperty.call(t,o)&&(e[o]=t[o])}return e}).apply(this,arguments)}var i=e(require("tough-cookie")).CookieJar;module.exports=function(e){var c,u,d,l=e||{},h=l.jarFile,f=l.userAgent,p=l.verbose,m=l.beforeSend,v=l.complete,y={},g={},j=function e(r,t,o){try{var n={method:r.toUpperCase(),url:C(t),options:S(o)};return m&&((n=m(n,g)).method=n.method.toUpperCase(),n.url=C(n.url),n.options=S(n.options)),Promise.resolve(O(n)).then(function(r){var t=r.response,o=r.redirect;return o?e(o.method,o.url,o.options):(y.url=n.url,y.cookie=x(y.url.href),y.response=t,v&&v(n,g,y),t)})}catch(e){return Promise.reject(e)}},C=function(e){return e.constructor==URL&&(e=e.href),y.url&&e.match(/^\//)&&(e=y.url.origin+e),new URL(e)},S=function(e){return e||(e={}),e.headers=k(e.headers),e},k=function(e){return e?Object.entries(e).reduce(function(e,r){var t=r[1];return e[r[0].replace(/\b./g,function(e){return e.toUpperCase()})]=t,e},{}):{}},O=function(e){var t=e.method,i=e.url,c=e.options;try{var u=c.headers,d=c.data,l=c.multiPartData,h=c.json,m=x(i.href),v={method:t,headers:Object.assign({},u),maxRedirects:0,validateStatus:function(e){return e<500}};if(v.headers.Host=i.host,i=i.href,m.length&&(v.headers.Cookie=m),!v.headers["User-Agent"]&&f&&(v.headers["User-Agent"]=f),d)"GET"==t?i+=(i.match(/\?/)?"&":"?")+a(d):(v.headers["Content-Type"]||(v.headers["Content-Type"]="application/x-www-form-urlencoded"),v.data=a(d));else if(l){var y=new o;(l||[]).forEach(function(e){y.append(e.name,e.file?n.createReadStream(e.file):e.hasOwnProperty("value")?e.value:e.contents)}),v.data=y,v.headers=s({},v.headers,y.getHeaders())}return h&&(v.headers["Content-Type"]="application/json",v.data=JSON.stringify(h)),p&&console.log(t,i,v),Promise.resolve(r(s({url:i,method:t},v))).then(function(e){return P(t,i,c,e)})}catch(e){return Promise.reject(e)}},P=function(e,r,t,o){var a,s=o.status,i=o.data,l=k(o.headers);if(p&&console.log({statusCode:s,data:i,headers:l}),l["Set-Cookie"]){var f=b(r);if(l["Set-Cookie"].forEach(function(e){c.setCookieSync(e,f)}),h){var m=c.toJSON().cookies,v={};n.pathExistsSync(h)&&(v=n.readJsonSync(h)),v.constructor==Object?v.cookies=m:v=m,n.writeFileSync(h,JSON.stringify(v,null,2))}}return/^3/.test(""+s)&&(a={method:e,url:l.Location,options:t},s<=303&&(a.method="GET",delete a.options.data)),u=void 0,d=void 0,{response:{statusCode:s,data:i,headers:l},redirect:a}},b=function(e){return e.replace(/\?.*/,"")},x=function(e){return c.getCookiesSync(b(e)).join("; ")};if("get post put patch delete head options".split(" ").forEach(function(e){y[e]=function(){try{var r=arguments;return Promise.resolve(j.apply(void 0,[e].concat([].slice.call(r))))}catch(e){return Promise.reject(e)}}}),y.text=function(){return y.response?y.response.data:""},y.json=function(){if(!d&&y.response){var e=y.response,r=e.data;r&&(""+e.headers["Content-Type"]).match("json")&&(d=r)}return d},y.$=function(){if(!u&&y.response){var e=y.response,r=e.data,o=e.headers,n=(""+o["Content-Type"]).match(/(html|xml)/);n&&(u=t.load(r,{xmlMode:"xml"==n[1]}))}return u?u.apply(void 0,[].slice.call(arguments)):[]},y.submit=function(e,r,t){try{var o=y.$(e);return Promise.resolve(function(){if(o.length){var e=o.attr("action"),n=o.attr("method")||"GET";return r=Object.assign(o.serializeArray().reduce(function(e,r){return e[r.name]=r.value,e},{}),r||{}),Promise.resolve(j(n,e,s({},t,{data:r})))}}())}catch(e){return Promise.reject(e)}},n.pathExistsSync(h)){var w=n.readJsonSync(h),E=w.cookies||w;c=i.fromJSON({cookies:E.constructor==Array?E:[]})}else c=new i;return y};
//# sourceMappingURL=webhead.js.map
