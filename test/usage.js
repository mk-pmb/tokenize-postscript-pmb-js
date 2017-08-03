/*jslint indent: 2, maxlen: 80, node: true */
/* -*- tab-width: 2 -*- */
'use strict';

var eq = require('equal-pmb'),
  rrfs = require('read-resolved-file-sync')(require);

function fixture(fn) { return rrfs('./' + fn); }




(function readmeDemo(equal) {
  //#u
  var makeTokenizer = require('tokenize-postscript-pmb'),
    psCode = fixture('./input/usage.ps'),
    parseOpt = { ignWsp: false },
    tokenize = makeTokenizer(psCode, parseOpt),
    tokens = tokenize(),
    expected = require('./expected/usage.tokens.json');

  equal(tokenize.remainder(), '');
  equal(tokens, expected);
  //#r
}(eq));









console.log("+OK usage test passed.");    //= "+OK usage test passed."
