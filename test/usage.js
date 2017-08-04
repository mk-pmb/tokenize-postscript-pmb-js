/*jslint indent: 2, maxlen: 80, node: true */
/* -*- tab-width: 2 -*- */
'use strict';

var eq = require('equal-pmb'),
  rrfs = require('read-resolved-file-sync')(require);

eq.lists.dumpLongerList = 15;
function fixture(fn) { return rrfs('./' + fn); }

fixture.json = function (fn) {
  return JSON.parse(fixture(fn + '.json').replace(/^\uFEFF/, ''
    ).replace(/,(\s*\n)null *(\]\s*)$/, '$1$2'));
};



(function readmeDemo() {
  //#u
  var makeTokenizer = require('tokenize-postscript-pmb'),
    psCode = fixture('input/usage.ps'),
    parseOpt = { ignWsp: false },
    tokenize = makeTokenizer(psCode, parseOpt),
    tokens = tokenize(),
    expected = fixture.json('expect/usage.tokens'),
    equal = require('equal-pmb');

  equal(tokenize.remainder(), '');
  equal.lists(tokens, expected);
  //#r
}());









console.log("+OK usage test passed.");    //= "+OK usage test passed."
