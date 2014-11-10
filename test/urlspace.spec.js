describe('UrlSpace', function () {
  'use strict';

  var chai = require('chai');
  var sinonChai = require('sinon-chai');
  chai.use(sinonChai);
  var expect = chai.expect;

  var _ = require('lodash');
  var UrlSpace = require('../lib/urlspace');

  function testAll(urls, rules) {
    var run = new UrlSpace(rules || {});
    _.each(urls, function (result, url) {
      expect(run(url)).to.equal(result, url);
    });
  }

  it('instantiates correctly', function (done) {
    expect(new UrlSpace()).to.be.a('function');
    done();
  });
  it('allows urls by default', function () {
    var rules = {};
    var urls = {
      'http://localhost/': true,
      'http://127.0.01/': true,
      'https://www.enrise.com/': true
    };
    testAll(urls, rules);
  });
  it('rejects urls that do not match the rules for a single part', function () {
    var rules = {
      hostname: ['localhost']
    };
    var urls = {
      'http://localhost/': true,
      'http://127.0.01/': false,
      'https://www.enrise.com/': false
    };
    testAll(urls, rules);
  });
  it('rejects urls that do not match the rules for any part', function () {
    var rules = {
      hostname: ['localhost'],
      pathname: ['/path/**'],
    };
    var urls = {
      'http://localhost/': false,
      'http://127.0.01/': false,
      'http://localhost/path/': true,
      'http://127.0.01/path/': false,
    };
    testAll(urls, rules);
  });
  it('allows multiple matches on rules in same part', function () {
    var rules = {
      hostname: ['localhost', '{,www.}enrise.com']
    };
    var urls = {
      'http://localhost/': true,
      'http://127.0.01/': false,
      'https://www.enrise.com/': true,
      'http://enrise.com/': true
    };
    testAll(urls, rules);
  });
  it('allows exceptions to rules', function () {
    var rules = {
      path: [
        '/path/**',
        '!/path/secret/**',
        '!**/*.jpeg'
      ]
    };
    var urls = {
      'http://localhost/': false,
      'http://localhost/path/': true,
      'http://localhost/path/secret/': false,
      'http://localhost/path/secret/deeper/': false,
      'http://localhost/path/deeper/': true,
      'http://localhost/path/deeper/image.jpeg': false
    };
    testAll(urls, rules);
  });
  it('allows urls that do not match if only negative rules are present', function () {
    var rules = {
      path: [
        '!/path/1/**',
        '!/path/2/**'
      ]
    };
    var urls = {
      'http://localhost/': true,
      'http://localhost/path/': true,
      'http://localhost/path/1/': false,
      'http://localhost/path/1/deeper/': false,
      'http://localhost/path/3/': true
    };
    testAll(urls, rules);
  });
  it('applies rules on parsed querystring variables', function () {
    var rules = {
      query: {
        somevar: ['!**'] // Deny everything that has this qs parameter defined
      }
    };
    var urls = {
      'http://localhost/': true,
      'http://localhost/?somevar=yes': false,
      'http://localhost/?something=else&somevar=yes&somemore=true': false,
      'http://localhost/?somevar': false,
      'http://localhost/#?somevar=yes': true,
      'http://localhost/somevar=yes/?': true
    };
    testAll(urls, rules);
  });
});
