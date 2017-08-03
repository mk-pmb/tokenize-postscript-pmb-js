/*jslint indent: 2, maxlen: 80, continue: false, unparam: false, node: true */
/* -*- tab-width: 2 -*- */
'use strict';

var EX, strPeek = require('string-peeks'), types = require('./src/types');


function inPair(x, p) { return (x === p[0] ? 1 : (x === p[1] ? 2 : 0)); }


EX = function (code, opt) {
  opt = (opt || false);
  var pmt = function () { return EX.parseMoreTokens.apply(pmt, arguments); };
  pmt.spbuf = strPeek.fromText((code || opt.code),
    { anomalyDescrs: opt.anomalyDescrs,
      acceptAnomalies: opt.acceptAnomalies });
  pmt.opt = {
    convert:  opt.convert,
    collect:  opt.collect,
    ignWsp:   opt.ignWsp,
  };
  pmt.remainder = function () { return pmt.spbuf.buf; };
  return pmt;
};


EX.sepCharsRgx = /(\s|%)|([\(\)\[\]\{\}])|(<+)|(>+)|(?!^\/?)(\/)/;
EX.parseMoreTokens = function (limit) {
  var pmt = this, spbuf = pmt.spbuf, opt = pmt.opt, newTokens = [], ctx,
    wspRgx = /^\s+/, wantWsp = (opt.ignWsp === false),
    sepNoInc = { mark: EX.sepCharsRgx, inc: false },
    wsp, tkn, tmp;
  ctx = { parseMoreTokens: pmt, buf: spbuf,
    limit: (limit === +limit ? limit : Number.POSITIVE_INFINITY), };
  function eat1() {
    wsp = spbuf.peekMark(wspRgx);
    if (wsp) {
      spbuf.eat();
      if (spbuf.isEmpty()) { return (wantWsp && { t: ' ', w: wsp }); }
    }
    tkn = spbuf.peekMark(sepNoInc, null, EX.predigestOneToken);
    if (!tkn) { spbuf.anomaly('foundNonToken'); }
    if (wsp && wantWsp) { tkn.w = wsp; }
    console.log('eat1:', newTokens.length, tkn);
    if (opt.convert) {
      tmp = opt.convert(tkn, ctx);
      if (tmp === null) { return 'skip'; }
      if (tmp !== undefined) { tkn = tmp; }
    }
    if (opt.collect) { opt.collect.push(tkn); }
    newTokens.push(tkn);
    limit -= 1;
  }
  while (spbuf.notEmpty() && (ctx.limit > 0)) { eat1(); }
  return newTokens;
};


EX.predigestOneToken = function digest(tx, sep) {
  //console.log({ predigestOneToken: [ tx, sep ] });
  if (!sep) { return sep; }
  if (tx) { return EX.parseName(this.eat()); }
  var buf = this, wsp = sep[1], brak = sep[2],
    angOp = sep[3], angCl = sep[4];
  if (wsp) {
    if (wsp === '%') { return EX.parseComment(buf); }
    return buf.anomaly('predigest_wsp');
  }
  if (brak) { return EX.foundBracket(brak, buf); }
  return { xx: buf.eatChars(sep[0].length),
    b: brak, aO: angOp, aC: angCl };
};


EX.endCommentRgx = /\r\n?|\n|\f/;
EX.parseComment = function (buf) {
  var c = buf.eatUntilMarkOrEnd(EX.endCommentRgx, { digest: String });
  return { t: ' ', v: c };
};


EX.parseName = function (src) {
  var num = EX.parseNumber(src), sl, tkn;
  if (num) { return num; }
  sl = /^\/*/.exec(src)[0].length;
  if (sl) {
    if (sl > 2) { throw new Error('Only one token per call!'); }
    src = src.slice(sl);
  }
  tkn = types.bless('name', src);
  if (sl === 0) { tkn.x = true; }
  if (sl === 2) { tkn.x = '//'; }
  return tkn;
};


EX.maybeNumberRgx = new RegExp(('^' +
  '([\\+\\-]?)([0-9]*)' +
  '(#[0-9a-zA-Z]+$|)' +
  '(\\.[0-9]*|)([Ee][\\+\\-]?[0-9]+|)' +
  '$'), '');
EX.parseNumber = function (src) {
  var m = (EX.maybeNumberRgx.exec(src) || false), sign = m[1], head = m[2],
    hash = m[3], frac = m[4], exp = m[5];
  if (!m) { return false; }
  if (head) {
    if (hash) {
      if (sign) { return false; }
      return types.makeRadixNumber(head, hash.slice(1));
    }
    if ((!frac) && (!exp)) { return types.blessIntOrRealIfHuge(+src); }
  } else {
    if (hash || (!frac) || (frac === '.')) { return false; }
  }
  return types.bless('real', +src);
};


EX.eatWhitespace = function (peek) {
  var wsp = '', more = /^(\s+|%)/, add;
  while (peek(more)) {
    add = peek.eat();
    wsp += add;
    if (add === '%') { wsp += EX.eatComment(peek); }
  }
  return wsp;
};


EX.foundBracket = function (br, buf) {
  if (br === ')') { return buf.anomaly('unexpStringTerm'); }
  buf.eatChars(br.length);
  if (br === '(') { return EX.parseString(buf); }
  if (inPair(br, '[]')) { return types.bless('name', br, 'x'); }
  if (inPair(br, '{}')) { return types.bless('x_scan_mark', br); }
  throw new Error('unsupported bracket type: ' + br);
};


EX.parseString = function (buf) {
  var fx = /\(|\)|\\/;
  buf.anomaly(':TODO:parseString');
  return fx;
};





























module.exports = EX;
