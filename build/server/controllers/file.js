// Generated by CoffeeScript 1.9.0
var File, fs, onThumbCreation;

File = require('../models/file');

onThumbCreation = require('../../init').onThumbCreation;

fs = require('fs');


/**
 * Get given file, returns 404 if photo is not found.
 */

module.exports.fetch = function(req, res, next, id) {
  if (id.indexOf('.jpg') > 0) {
    id = id.substring(0, id.length - 4);
  }
  return File.find(id, (function(_this) {
    return function(err, file) {
      if (err) {
        return res.error(500, 'An error occured', err);
      }
      if (!file) {
        console.log('not file in fetch id');
        console.log(id);
        return res.error(404, 'File not found');
      }
      req.file = file;
      return next();
    };
  })(this));
};


/**
 * Returns a list of n photo (from newest to oldest )
 * skip : the number of the first photo of the view not to be returned
 * limit : the max number of photo to return
 */

module.exports.photoRange = function(req, res, next) {
  var dates, limit, onCreation, options, percent, skip, _ref;
  if (req.params.skip != null) {
    skip = parseInt(req.params.skip);
  } else {
    skip = 0;
  }
  if (req.params.limit != null) {
    limit = parseInt(req.params.limit);
  } else {
    limit = 100;
  }
  _ref = onThumbCreation(), onCreation = _ref[0], percent = _ref[1];
  if (onCreation) {
    return res.send({
      "percent": percent
    });
  } else {
    dates = {};
    options = {
      limit: limit,
      skip: skip,
      descending: true
    };
    return File.imageByDate(options, (function(_this) {
      return function(err, photos) {
        var hasNext;
        if (err) {
          return res.error(500, 'An error occured', err);
        } else {
          if (photos.length === limit) {
            hasNext = true;
          } else {
            hasNext = false;
          }
          return res.send({
            files: photos,
            firstRank: skip
          }, 200);
        }
      };
    })(this));
  }
};


/**
 * Gets an array that gives the number of photo for each month, from the most
 * recent month to the oldest
 * [{nPhotos:`number`, month:'YYYYMM'}, ...]
 */

module.exports.photoMonthDistribution = function(req, res, next) {
  console.log('enter photoMonthDistribution');
  return File.imageByMonth({
    group: true,
    group_level: 2,
    reduce: true
  }, function(error, distribution_raw) {
    var distribution, k, month, monthStr, yearStr, _i, _ref;
    distribution = [];
    for (k = _i = _ref = distribution_raw.length - 1; _ref <= 0 ? _i <= 0 : _i >= 0; k = _ref <= 0 ? ++_i : --_i) {
      month = distribution_raw[k];
      yearStr = month.key[0] + '';
      monthStr = month.key[1] + '';
      if (monthStr.length === 1) {
        monthStr = '0' + monthStr;
      }
      distribution.push({
        nPhotos: month.value,
        month: yearStr + monthStr
      });
    }
    return res.send(distribution, 200);
  });
};


/**
 * Returns thumb for given file.
 * there is a bug : when the browser cancels many downloads, some are not
 * cancelled, what leads to saturate the stack of threads and blocks the
 * download of thumbs.
 * Cf comments bellow to reproduce easily
 */

module.exports.photoThumb = function(req, res, next) {
  var stream, which;
  which = req.file.binary.thumb ? 'thumb' : 'file';
  stream = req.file.getBinary(which, function(err) {
    if (err) {
      console.log(err);
      next(err);
      stream.on('data', function() {});
      stream.on('end', function() {});
      stream.resume();
    }
  });
  req.on('close', function() {
    return stream.abort();
  });
  res.on('close', function() {
    return stream.abort();
  });
  return stream.pipe(res);
};


/**
 * Returns thumb (binary) for given file.
 * TO BE TESTED AND THEN REPLACE photoThumb
 */

module.exports.photoThumbFast = function(req, res, next) {
  var stream;
  stream = new File({
    id: req.param.id
  }).getBinary('thumb', function(err) {
    if (err) {
      return next(err);
    }
  });
  req.on('close', function() {
    return stream.abort();
  });
  return stream.pipe(res);
};


/**
 * Returns screen (binary) for given file.
 */

module.exports.photoScreen = function(req, res, next) {
  var stream, which;
  which = req.file.binary.screen ? 'screen' : 'file';
  stream = req.file.getBinary(which, function(err) {
    if (err) {
      return next(err);
    }
  });
  return stream.pipe(res);
};


/**
 * Returns binary of the photo
 */

module.exports.photo = function(req, res, next) {
  var stream;
  console.log('get raw photo reached');
  stream = req.file.getBinary('file', function(err) {
    if (err) {
      return next(err);
    }
  });
  return stream.pipe(res);
};
