/*jslint indent: 2, maxlen: 80, continue: false, unparam: false, node: true */
/* -*- tab-width: 2 -*- */
'use strict';

var bySymb = {}, byName = {}, EX = { bySymbol: bySymb, byName: byName },
  parseIntLoudFail = require('parseint-loudfail'),
  symb2name = require('./types.symb2name.json');


function registerType(symb) {
  var name = symb2name[symb], ty = { name: name, symb: symb };
  ty.api = {};
  EX.bySymbol[symb] = ty;
  EX.byName[name] = ty;
}
Object.keys(symb2name).sort().forEach(registerType);


EX.bless = (function (fxs) {
  return function bless(t, v, fx) {
    var s = (bySymb[t] || byName[t] || false).symb, r;
    if (!s) { throw new Error('Unsupported type spec: ' + t); }
    r = { t: s, v: v };
    if (fx) { fxs[fx](r); }
    return r;
  };
}({
  x: function (t) { t.x = true; },
  '//': function (t) { t.x = '//'; },
}));


EX.upgrade = function (x) {
  var ty = (x && x.t && bySymb[x.t]);
  if (!ty) { return x; }
  return Object.assign(x, ty.api);
};


EX.toKey = function (x) {
  var ts = String((x || false).t || 'E_NO_TYPE'), vStr;
  if (!bySymb[ts]) { throw new Error('unsupported type: ' + String(ts)); }
  vStr = String(x.v);
  // ^-- problem: useless for container types
  return (ts + vStr);
};


EX.name2symb = function (n) { return ((byName[n] || false).symb || false); };


EX.blessIntOrRealIfHuge = function (n) {
  n = +n;
  if (EX.verifySafeInteger(n)) { return EX.bless('integer', n); }
  return EX.bless('real', n);
};


EX.verifySafeInteger = function (n) {
  return ((n === +n)
    && ((n + 1) !== (n + 2))
    && ((n - 1) !== (n - 2)));
};


EX.makeRadixNumber = function (radix, digits) {
  var n = parseIntLoudFail(digits || '0', +radix, false);
  if (n === false) { return n; }
  return EX.blessIntOrRealtIfHuge(n);
};
























module.exports = EX;
