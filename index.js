'use strict';
const cheerio = require('cheerio');
const path = require('path');
const fs = require('fs');
const url = require('url');
const sizeOf = require('image-size');
const contentTypes = {
  ".png": "image/png",
  ".gif": "image/gif",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".bmp": "image/bmp",
  ".webp": "image/webp"
}

/**
 * Converts local img urls and sources to base 64 data uri in html files
 */
module.exports = function(html,assetRoot) {
  html = html instanceof Buffer?html:fs.readFileSync(html);
  let dom = cheerio.load(String(html))
  convertToInlineImages(dom);

  return new Buffer(dom.html({
    decodeEntities: false
  }))

  function convertToInlineImages(dom) {
    dom('[img-prop]').each(function(idx, el) {
      el = dom(el)
      let src = el.attr('img-url');
      if (src && isLocalImg(src)) {

        /**
         * If need to enable lqip feature 
         * 
         * @lqip-parent-url is mandatory
         */
        if(el.attr('lqip') == 'true' && el.attr('lqip-parent-url')){
          let highResFile = el.attr('lqip-parent-url');         
          let bigFile = path.join(assetRoot, highResFile);
          let dimensions = sizeOf(bigFile);
          el.css("max-width", dimensions.width+'px');
          el.css("max-height", dimensions.height+'px');
          let pB = (dimensions.height / dimensions.width) * 100;
          el.append(`<div class="aspectRatioPlaceholder-fill" style="padding-bottom:${pB}%"></div>`)
        }

        let file = path.join(assetRoot, src);
        let img = fs.readFileSync(file);
        var contentType = contentTypes[path.extname(file)] || 'image/png';
        var dataUri = "data:" + contentType + ";base64," + img.toString("base64");
        var prop = el.attr('img-prop');
        var oldValue = el.attr(prop);
        var newValue = oldValue.replace(src, dataUri);
        el.attr(prop, newValue);
      }
    })
  }

  function isLocalImg(href) {
    return href && !url.parse(href).hostname;
  }
};
