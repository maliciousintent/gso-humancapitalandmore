/**
* Original express-uglify modules is by Nick Crohn
* https://github.com/ncrohn/express-uglify
*
* MIT License copyright (c) 2012 Nick Crohn
*
*/


module.exports = function(options) {


  /**
   * File System
   *
   * MIT License copyright (c) 2012 Nick Crohn
   *
   */

  var fileSystem = module.exports,
      fs = require("fs"),
      path = require("path"),
      cachePath = "/./.cache",
      extension = ".ugly";

  /*
   * Retrieve a file in a non-blocking fashion
   */

  fileSystem.getFile = function(filePath, callback) {
    //First we need to see if the cache version exists

    var base = path.basename(filePath),
        dir = path.dirname(filePath),
        cacheDir = path.normalize(dir+cachePath)+"/",
        cacheFile = cacheDir+base.replace(".js", extension+".js");

    function getCachedFile() {
      fs.readFile(cacheFile, "utf-8",
        function(err, data) {
          if(err) console.log('error', err);
          callback(data, true);
        });
    }

    function getOriginalFile() {
      fs.readFile(filePath, "utf-8",
        function(err, data) {
          if(err) console.log('error', err);
          callback(data, false);
        });
    }

    // Match version for compatibility
    var exists = (process.version.match(/^v0\.[4-6]{1}\.[0-9]{2}$/)) ? path.exists : fs.exists;

    exists(cacheDir,
      function(dirExists) {
        if(dirExists) {

          exists(cacheFile,
            function(fileExists) {
              if(fileExists) {
                var cst = fs.statSync(cacheFile),
                    ost = fs.statSync(filePath);

                // Compare modified times if the original file is newer than the cached file rebuild
                if(ost.mtime > cst.mtime) {
                  // return the original file
                  getOriginalFile();
                } else {
                  // return the cached file
                  getCachedFile();
                }

              } else {
                // return the original file
                getOriginalFile();
              }
            });

        } else {
          try {
            fs.mkdirSync(cacheDir, 0755);
          } catch (x) {
            console.log('error', 'ERROR: ' + x);
          }
          getOriginalFile();
        }
      });
  };

  fileSystem.writeFile = function(filePath, data, callback) {
    var base = path.basename(filePath),
        dir = path.dirname(filePath),
        cacheDir = path.normalize(dir+cachePath)+"/",
        cacheFile = cacheDir+base.replace(".js", ".ugly.js");

    fs.writeFile(cacheFile, data, "utf-8",
      function(err) {
        if(err) console.log('error', err);
        callback();
      });
  };






  /**
   * Middleware
   *
   * MIT License copyright (c) 2012 Nick Crohn
   *
   */

  var uglify = require("uglify-js"),
      fsys = fileSystem,
      url = require("url"),
      src,
      maxAge = options.maxAge || 86400000; // default to 1 day


  if(options.hasOwnProperty("src")) {
    src = options.src;
  } else {
    throw new Error("ExpressUglify middleware requires a 'src' directory");
  }

  return function(req, res, next) {
    var path = url.parse(req.url).pathname;
    if(path.match(/\.js$/) && !path.match(/min/)) {
      fsys.getFile(src+path,
        function(data, isCached) {

          if(data === null) {
            console.log('info', '"GET ' + path + '" 404');
            res.status(404).end("file not found");
          } else {
            if(!isCached) {
              var ast;
              try {
                ast = uglify.parser.parse(data, true);
                ast = uglify.uglify.ast_mangle(ast);
                ast = uglify.uglify.ast_squeeze(ast);
                ast = uglify.uglify.gen_code(ast);
              } catch (x) {
                console.log('error', path + ' ' + x);
              }

              if(ast) {
                // Cache the file so we don't have to do it again.
                fsys.writeFile(src+path, ast,
                  function() {
                    console.log('debug', 'Cached uglified: '+path);
                  });
                console.log('info', '"GET ' + path + '" 200 - Minified');
                res.setHeader('Content-Type', 'text/javascript');
                res.status(200).send(ast);
              } else {
                console.log('warning', '"GET ' + path + '" 200 - Failed to Minify');
                res.setHeader('Content-Type', 'text/javascript');
                res.status(200).send(data);
              }

            } else {
              console.log('info', '"GET ' + path + '" 200 - Cached');
              res.setHeader('Expires', new Date(Date.now() + maxAge).toUTCString());
              res.setHeader('Cache-Control', 'public, max-age=' + (maxAge / 1000));
              res.setHeader('Content-Type', 'text/javascript');
              res.status(200).send(data);
            }
          }

        });
    } else {
      next();
    }

  };

};