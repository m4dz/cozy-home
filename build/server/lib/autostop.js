// Generated by CoffeeScript 1.8.0
var AppManager, Application, applicationTimeout, markBroken, startTimeout, stopApp;

Application = require('../models/application');

AppManager = require("../lib/paas").AppManager;

applicationTimeout = [];


/*
Mark application broken
   * Update application state in database
 */

markBroken = function(app, err) {
  app.state = "broken";
  app.password = null;
  app.errormsg = err.message;
  return app.save(function(saveErr) {
    if (saveErr) {
      return send_error(saveErr);
    }
  });
};


/*
Stop application <app> :
   * Stop process (via controller)
   * Update application state in database
   * Reset proxy routes
 */

stopApp = function(app) {
  var manager;
  manager = new AppManager;
  return manager.stop(app, (function(_this) {
    return function(err, result) {
      var data;
      if (err) {
        return markBroken(app, err);
      }
      data = {
        state: "stopped",
        port: 0
      };
      return app.updateAttributes(data, function(err) {
        if (err) {
          return send_error(err);
        }
        return manager.resetProxy(function(err) {
          if (err) {
            return markBroken(app, err);
          }
        });
      });
    };
  })(this));
};


/*
Start timeout for application other than proxy and home
    * After 3 minutes of inactivity, application are stopped
    if application is stoppable.
 */

startTimeout = function(name) {
  return applicationTimeout[name] = setTimeout(function() {
    if (name !== "home" && name !== "proxy") {
      return Application.all(function(err, apps) {
        var app, _i, _len, _results;
        _results = [];
        for (_i = 0, _len = apps.length; _i < _len; _i++) {
          app = apps[_i];
          if (app.slug === name && app.isStoppable && app.state === "installed") {
            console.log("stop : " + name);
            _results.push(stopApp(app));
          } else {
            _results.push(void 0);
          }
        }
        return _results;
      });
    }
  }, 5 * 60 * 1000);
};


/*
Restart tiemout for application.
    * Remove old timeout if it exists
    * Start new timeout (3 minutes)
 */

module.exports.restartTimeout = function(name) {
  if (applicationTimeout[name] != null) {
    clearTimeout(applicationTimeout[name]);
  }
  return startTimeout(name);
};


/*
Init timeout
    When home is started, it start timeout for all installed application
 */

module.exports.init = function() {
  return Application.all(function(err, apps) {
    var app, _i, _len, _results;
    _results = [];
    for (_i = 0, _len = apps.length; _i < _len; _i++) {
      app = apps[_i];
      if (app.state === 'installed' && app.isStoppable) {
        _results.push(startTimeout(app.slug));
      } else {
        _results.push(void 0);
      }
    }
    return _results;
  });
};
