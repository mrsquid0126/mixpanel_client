(function() {
  var Q, dateFormater, host, mixpanel, mixpanelToken, moment, querystring, request, send_request, serialize_base64, user_profile, _;

  Q = require('q');

  querystring = require('querystring');

  request = require('request');

  _ = require('underscore');

  moment = require('moment');

  mixpanelToken = require('../config').mixpanelToken;

  host = 'http://api.mixpanel.com';

  serialize_base64 = function(obj) {
    return new Buffer(JSON.stringify(obj)).toString('base64');
  };

  send_request = function(type, data, callback) {
    var qs, reqOpt;
    qs = querystring.stringify({
      data: serialize_base64(data),
      ip: 0,
      img: 0,
      verbose: 1
    });
    reqOpt = {
      url: "" + host + "/" + type + "/?" + qs,
      method: 'GET'
    };
    if (_.isFunction(callback)) {
      return request(reqOpt, callback);
    } else {
      return Q.Promise(function(resolve, reject, notify) {
        return request(reqOpt, function(err, msg, body) {
          if (err) {
            return reject(err);
          } else {
            return resolve(body);
          }
        });
      });
    }
  };

  dateFormater = function(date) {
    return moment(date).format('YYYY-MM-DD[T]HH:mm:ss');
  };

  user_profile = (function() {
    function user_profile(_arg) {
      this.$distinct_id = _arg.$distinct_id, this.$token = _arg.$token;
      this.type = 'engage';
    }

    user_profile.prototype.send_request = send_request;

    user_profile.prototype.qs = function(_arg) {
      var $ignore_time, $ip, $time, _ref;
      _ref = _arg != null ? _arg : {}, $ip = _ref.$ip, $time = _ref.$time, $ignore_time = _ref.$ignore_time;
      return {
        $distinct_id: this.$distinct_id,
        $token: this.$token,
        $ip: $ip,
        $time: $time,
        $ignore_time: $ignore_time
      };
    };

    user_profile.prototype.set = function(_arg) {
      var callback, data, options, properties;
      properties = _arg.properties, options = _arg.options, callback = _arg.callback;
      if (!properties) {
        throw new Error('invalid parameter');
      }
      data = _.extend(this.qs(options), {
        $set: properties
      });
      return this.send_request(this.type, data, callback);
    };

    user_profile.prototype.set_once = function(_arg) {
      var callback, data, options, properties;
      properties = _arg.properties, options = _arg.options, callback = _arg.callback;
      if (!properties) {
        throw new Error('invalid parameter');
      }
      data = _.extend(this.qs(options), {
        $set_once: properties
      });
      return this.send_request(this.type, data, callback);
    };

    user_profile.prototype.add = function(_arg) {
      var callback, data, options, properties;
      properties = _arg.properties, options = _arg.options, callback = _arg.callback;
      if (!(properties && _.every(properties, _.isFinite))) {
        throw new Error('invalid parameter');
      }
      data = _.extend(this.qs(options), {
        $add: properties
      });
      return this.send_request(this.type, data, callback);
    };

    user_profile.prototype.append = function(_arg) {
      var callback, data, options, properties;
      properties = _arg.properties, options = _arg.options, callback = _arg.callback;
      if (!properties) {
        throw new Error('invalid parameter');
      }
      data = _.extend(this.qs(options), {
        $append: properties
      });
      return this.send_request(this.type, data, callback);
    };

    user_profile.prototype.union = function(_arg) {
      var callback, data, options, properties;
      properties = _arg.properties, options = _arg.options, callback = _arg.callback;
      if (!(properties && _.every(properties, _.isArray))) {
        throw new Error('invalid parameter');
      }
      data = _.extend(this.qs(options), {
        $union: properties
      });
      return this.send_request(this.type, data, callback);
    };

    user_profile.prototype.unset = function(_arg) {
      var callback, data, options, properties;
      properties = _arg.properties, options = _arg.options, callback = _arg.callback;
      if (!(properties && _.isArray(properties))) {
        throw new Error('invalid parameter');
      }
      data = _.extend(this.qs(options), {
        $unset: properties
      });
      return this.send_request(this.type, data, callback);
    };

    user_profile.prototype["delete"] = function(callback) {
      var data;
      data = _.extend(this.qs(), {
        $delete: ''
      });
      return this.send_request(this.type, data, callback);
    };

    user_profile.prototype.track_charge = function(_arg) {
      var amount, callback, options, properties, time;
      time = _arg.time, amount = _arg.amount, options = _arg.options, callback = _arg.callback;
      properties = {
        $transactions: {
          $time: dateFormater(time),
          $amount: amount
        }
      };
      return this.append({
        properties: properties,
        options: options,
        callback: callback
      });
    };

    return user_profile;

  })();

  mixpanel = (function() {
    function mixpanel() {
      this._token = mixpanelToken;
    }

    mixpanel.prototype.alias = function(distinct_id, alias, callback) {
      var eventName, properties;
      eventName = '$create_alias';
      properties = {
        alias: alias
      };
      return this.track({
        eventName: eventName,
        properties: properties,
        distinct_id: distinct_id
      }, callback);
    };

    mixpanel.prototype.track = function(_arg, callback) {
      var data, distinct_id, eventName, ip, properties, timestamp, type;
      eventName = _arg.eventName, properties = _arg.properties, distinct_id = _arg.distinct_id, timestamp = _arg.timestamp, ip = _arg.ip;
      type = 'track';
      _.extend(properties, {
        token: this._token,
        distinct_id: distinct_id,
        time: timestamp,
        ip: ip
      });
      data = {
        event: eventName,
        properties: properties
      };
      return send_request(type, data, callback);
    };

    mixpanel.prototype.profile = function(distinct_id) {
      return new user_profile({
        $distinct_id: distinct_id,
        $token: this._token
      });
    };

    return mixpanel;

  })();

  module.exports = function() {
    return new mixpanel();
  };

}).call(this);