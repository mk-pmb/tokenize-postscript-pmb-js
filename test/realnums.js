/*jslint indent: 2, maxlen: 80, node: true */
/* -*- tab-width: 2 -*- */
'use strict';

var EX = module.exports, eq = require('equal-pmb'),
  univeil = require('univeil'),
  makeTokenizer = require('tokenize-postscript-pmb');


function fail(why) { throw new Error(why); }


EX.realNumSeed = {
  v: '',  // initial value
  s: 0,   // score; here: digits
  r: 6,   // required score
  //Y: [],    // un-comment to trace and explain values
};


EX.realNumsRecipe = [
  'sign',
  'digits',
  'comma',
  'garbage',
  'exponent',
  'garbage',
  'digits',
  'garbage',
];


EX.extendCandidateList = function (recipe, cList) {
  recipe.forEach(function (step) { cList = EX.multiply(cList, step); });
  return cList;
};


EX.multiply = function (olds, mods, dest) {
  if (!dest) { dest = []; }
  var moName = String(mods);
  if (mods.substr) { mods = (EX[mods] || mods); }

  function addCandidate(o, m, i) {
    var c = Object.assign({}, o, { v: m.v.replace(/\v/g, o.v),
      s: o.s + m.s, r: o.r + (m.r || 0) });
    if (c.v === m.v) { c.v = o.v + m.v; }
    if (c.Y && c.Y.concat) { c.Y = c.Y.concat([ [moName, i, c.v] ]); }
    dest.push(c);
  }

  olds.forEach(function (o) {
    mods.forEach(function (m, i) { addCandidate(o, m, i); });
  });
  return dest;
};


EX.runTests = function () {
  EX.extendCandidateList(EX.realNumsRecipe, [ EX.realNumSeed ]
    ).forEach(EX.testOneCandidate);
};


EX.intRgx = /^[\-\+]?(0x|)[0-9]+$/;


EX.testOneCandidate = function (c) {
  var v = c.v, n = +v, f = parseFloat(v),
    shouldBeValid = (((c.s || 0) >= c.r) && (n === f)),
    psTok = makeTokenizer.simpleVanilla(v);
  //console.log(shouldBeValid, c);
  if (shouldBeValid) { return eq(psTok, [ { t: '\u211D', v: f } ]); }
  if (v === '') { return eq(psTok, []); }
  if (psTok.length !== 1) { return eq(psTok, '(just 1 token)'); }
  if (psTok[0].t === 'f') { return eq(psTok, '(non-float token)'); }
  return true;
};


EX.garbage = [
  { v: '', s: 0 },
  { v: 'foo', s: NaN },
];


EX.sign = [
  { v: '', s: 0 },
  { v: '0x', s: NaN },
  { v: 'awrsd', s: NaN },
  { v: '+', s: 0 },
  { v: '-', s: 0 },
  { v: 'bar+', s: NaN },
  { v: 'bar-', s: NaN },
  { v: '+bar', s: NaN },
  { v: '-bar', s: NaN },
];


EX.digits = [
  { v: '', s: 0 },
  { v: '0', s: 1 },
  { v: '5', s: 1 },
  { v: '23', s: 1 },
  { v: '¹²³', s: NaN },
];


EX.comma = [
  { v: '', s: 0 },
  { v: '.', s: 5 },
  { v: '.825', s: 6 },
  { v: 'm00.', s: NaN },
  { v: '_', s: NaN },
];


EX.exponent = [
  { v: '', s: 0 },
  { v: 'e', s: 5, r: 1 },   // raise r: exponent needs a digit
  { v: 'E', s: 5, r: 1 },
];












EX.runTests();
console.log("+OK realnums test passed.");     //= "+OK realnums test passed."
