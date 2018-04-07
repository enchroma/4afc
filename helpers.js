var xhr = require('xhr-request');
//**************
/// HELPER FUNCTIONS
//**************

if (!window.requestAnimationFrame) {
  window.requestAnimationFrame = (function() {
    return (
      window.webkitRequestAnimationFrame ||
      window.mozRequestAnimationFrame ||
      window.oRequestAnimationFrame ||
      window.msRequestAnimationFrame ||
      function(/* function FrameRequestCallback */ callback, /* DOMElement Element */ element) {
        window.setTimeout(callback, 1000 / 60);
      }
    );
  })();
}

if (!window.perfomance || !window.perfomance.now) {
  Date.now ||
    (Date.now = function() {
      return new this().getTime();
    });
  (window.perfomance || (window.perfomance = {})).now = function() {
    return Date.now() - offset;
  };

  var offset =
    (window.perfomance.timing || (window.perfomance.timing = {})).navigatorStart || (window.perfomance.timing.navigatorStart = Date.now());
}

//**************
/// MATCHING COLOR
//**************

function userColorRGB() {
  var r = UserColor.getRed();
  var g = UserColor.getGreen();
  var b = UserColor.getBlue();
  if (USE_HSL) {
    var rgb = UserColor.toRGB();
    r = Math.round(rgb.red * 255);
    g = Math.round(rgb.green * 255);
    b = Math.round(rgb.blue * 255);
  }
  return 'rgb(' + r + ', ' + g + ', ' + b + ')';
}

function rgbToHSL(r, g, b, css) {
  (r /= 255), (g /= 255), (b /= 255);

  var max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  var h,
    s,
    l = (max + min) / 2;

  if (max == min) {
    h = s = 0; // achromatic
  } else {
    var d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }

    h /= 6;
  }
  if (!css) {
    return [parseFloat((h * 100).toFixed(1)), parseFloat((s * 100).toFixed(1)), parseFloat(l.toFixed(1))];
  }
  return 'hsl(' + (h * 100).toFixed(1) + '% , ' + (s * 100).toFixed(1) + '% , ' + l.toFixed(1) + ')';
}

var RGBToHex = function(r, g, b) {
  var bin = (r << 16) | (g << 8) | b;
  return (function(h) {
    return new Array(7 - h.length).join('0') + h;
  })(bin.toString(16).toUpperCase());
};

window.convertArrayOfObjectsToCSV = (args)=> {
  var result, ctr, keys, columnDelimiter, lineDelimiter, data;

  data = args.data || null;
  if (data == null || !data.length) {
    return null;
  }

  columnDelimiter = args.columnDelimiter || ',';
  lineDelimiter = args.lineDelimiter || '&#013;&#010;';

  keys = Object.keys(data[0]);

  result = '';
  result += keys.join(columnDelimiter);
  result += lineDelimiter;

  data.forEach(function(item) {
    ctr = 0;
    keys.forEach(function(key) {
      if (ctr > 0) result += columnDelimiter;

      result += item[key];
      ctr++;
    });
    result += lineDelimiter;
  });

  return result;
}

window.downloadCSV = (obj) =>{
  var data, filename, link;
  var csv = convertArrayOfObjectsToCSV({
    data: obj.data,
  });
  if (csv == null) return;
  var date = new Date();
  date.toLocaleString('en-us', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  filename = obj.filename || date + '.csv';

  if (!csv.match(/^data:text\/csv/i)) {
    csv = 'data:text/csv;charset=utf-8,' + csv;
    data = encodeURI(csv);
  }

  link = document.createElement('a');
  link.setAttribute('href', data);
  link.setAttribute('download', filename);
  link.click();

  return csv
}

window.loadConfig = function(cb) {
  xhr(`${window.BASE_PATH}config.json`, { json: true }, cb);
};

