/**
 * ##UrlSpace
 * Checks whether a URL is allowed. Used in crawlspace and urlspace.
 */
module.exports = function UrlSpace(config) {
  'use strict';

  var libUrl = require('url');
  var _ = require('lodash');
  var Minimatch = require('minimatch').Minimatch;

  var matchers = {};

  var log = function () {};
  // var log = console.log;

  function init() {
    matchers = makeRules(config, function (value) {
      return new Minimatch(value || '', {
        flipNegate: true
      });
    });
  }

  function makeRules(obj, fn) {
    function traverse(value) {
      if (_.isArray(value)) {
        return _.map(value, traverse);
      }
      if (_.isPlainObject(value)) {
        return _.mapValues(value, traverse);
      }
      return fn(value);
    }
    return traverse(obj);
  }

  function testRules(parts, ruleset, fn) {
    var complies = true;
    _.each(ruleset, function (rules, partname) {
      var part = parts[partname];
      if (_.isPlainObject(part)) {
        log('verbose', 'Now', complies, 'Testing nested property', partname);
        complies = testRules(part, rules, fn);
        return complies;
      }
      log('verbose', 'Now', complies, 'Testing part', partname);
      complies = fn(partname, part, rules);
      log('verbose', 'Now', complies, 'Tested part', partname);
      return complies; // Abort iteration if any part does not comply
    });
    return complies;
  }

  function testPart(partname, part, rules) {
    // Compliance state. Defaults to false, unless there are only negated rules present for the current part
    var partComplies = _.every(rules, 'negate');
    if (typeof part === 'undefined') {
      // part not present, should happen only to querystring keys
      log('verbose', 'Now', partComplies, partname, 'not present');
      return partComplies;
    }
    log('verbose', 'Now', partComplies, 'Testing part', partname, part);
    var partRules = [partComplies].concat(rules); // Prepend initial compliance to rules for use in `_.reduce`
    partComplies = _.reduce(partRules, function (complies, rule) {
      log('verbose', 'Now', complies, 'Testing rule', partname, rule.pattern);
      if (rule.match(part)) {
        log('verbose', 'Now', complies, 'Hit', rule.pattern, !rule.negate);
        return !rule.negate;
      }
      log('verbose', 'Now', complies, 'Miss', rule.pattern);
      return complies;
    });
    return partComplies;
  }

  function helper(href) {
    var url = libUrl.parse(href, true, true);
    log('verbose', 'Testing url', href, url);
    var urlComplies = testRules(url, matchers, testPart);
    log('verbose', 'Url Result', urlComplies);
    return urlComplies;
  }

  init();
  return helper;
};
