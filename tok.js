/*jslint indent: 2, maxlen: 80, continue: false, unparam: false, node: true */
/* -*- tab-width: 2 -*- */
'use strict';

var EX, strPeek = require('string-peeks'), types = require('./src/types');


function inPair(x, p) { return (x === p[0] ? 1 : (x === p[1] ? 2 : 0)); }
function pushIf(a, x) { if (x) { a.push(x); } }


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


EX.sepCharsMark = { inc: false,
  rgx: /(\s|%)|([\(\)\[\]\{\}<>])|(\/{1,2})/ };
EX.parseMoreTokens = function (limit) {
  var pmt = this, spbuf = pmt.spbuf, opt = pmt.opt, newTokens = [], ctx,
    wspRgx = /^\s+/, wantWsp = (opt.ignWsp === false),
    wsp, tkn, tmp;
  ctx = { parseMoreTokens: pmt, buf: spbuf,
    limit: (limit === +limit ? limit : Number.POSITIVE_INFINITY), };
  function eat1() {
    wsp = spbuf.peekMark(wspRgx);
    if (wsp) {
      spbuf.eat();
      if (spbuf.isEmpty()) { return (wantWsp && { t: ' ', w: wsp }); }
    }
    tkn = spbuf.peekMark(EX.sepCharsMark, null, EX.predigestOneToken);
    if (!tkn) { spbuf.anomaly('foundNonToken'); }
    if (wsp && wantWsp) { tkn.w = wsp; }
    //console.log('eat1:', newTokens.length, tkn);
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
  if (!sep) { return sep; }
  if (tx) { return EX.parseName('', this.eat()); }
  var buf = this, wsp = sep[1], brak = sep[2], sl = sep[3];
  if (wsp) {
    if (wsp === '%') { return EX.parseComment(buf); }
    return buf.anomaly('predigest_wsp');
  }
  if (brak) { return EX.foundBracket(brak, buf); }
  if (sl) {
    buf.eatChars(sl.length);
    buf.peekMark(EX.sepCharsMark, '');
    return EX.parseName(sl, this.eat());
  }
  buf.anomaly('predigestUnknownToken', sep[0]);
};


EX.endCommentRgx = /\r\n?|\n|\f/;
EX.parseComment = function (buf) {
  var c = buf.eatUntilMarkOrEnd(EX.endCommentRgx, { digest: String });
  return { t: ' ', v: c };
};


EX.parseName = function (slashes, src) {
  var num, tkn;
  if (slashes) {
    slashes = slashes.length;
    if (slashes > 2) { throw new Error('Only one token per call!'); }
  } else {
    num = EX.parseNumber(src);
    if (num) { return num; }
    slashes = 0;
  }
  tkn = types.bless('name', src);
  if (slashes === 0) { tkn.x = true; }
  if (slashes === 2) { tkn.x = '//'; }
  return tkn;
};


EX.maybeNumberRgx = new RegExp(('^' +
  '([\\+\\-]?)([0-9]*)' +
  '(#[0-9a-zA-Z]*$|)' +
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
  if (br === ')') { return buf.anomaly('unexpectedClosingParen'); }
  buf.eatChars(br.length);
  if (br === '(') { return EX.parseString(buf); }
  if (inPair(br, '[]')) { return types.bless('name', br, 'x'); }
  if (inPair(br, '{}')) { return types.bless('x_scan_mark', br); }
  var nx;
  if (inPair(br, '<>')) {
    nx = (buf.peekMark(/^[~<>]/, '') && buf.eat());
    if (nx === br) { return types.bless('name', br + nx, 'x'); }
    br += nx;
    buf.anomaly('unexpectedBrackets', br);
  }
  throw new Error('Bug: unsupported bracket type: ' + br);
};


EX.parseString = function (buf) {
  var strPt = [], dig = EX.strAttnDigest.bind(null, buf, strPt);
  strPt.parens = 1;
  while (strPt.parens > 0) { buf.peekMark(EX.strAttnMark, null, dig); }
  return types.blessBinStr(strPt.join(''));
};
EX.strAttnMark = { rgx: /\(|\)|\\/, inc: false };
EX.strAttnDigest = function (buf, strPt, tx, m) {
  //console.log({ attn: tx, m: m.slice() });
  if (!m) { buf.anomaly('unterminatedParenString'); }
  if (tx) { strPt.push(buf.eat()); }
  m = buf.eatChars(1);
  if (m === '\\') { return pushIf(strPt, EX.strBkslRgx.eat(buf)); }
  strPt.parens += (m === '(' ? 1 : -1);
  if (strPt.parens > 0) { strPt.push(m); }
};
EX.strBkslRgx = (function () {
  var rx = /^(?:([0-7]{1,3})|(\r\n?|\n)|(\\|\(|\))|([nrtbf]))/;
  function decode(tx, m) {
    if (!m) { return this.eatChars(1); }
    if (this.eat() !== tx) { throw new Error('Bug: misaligned match'); }
    var oct = m[1], eol = m[2], lit = m[3], ctrl = m[4];
    if (oct) { return String.fromCharCode(parseInt(oct, 8)); }
    if (eol) { return ''; }
    if (lit) { return lit; }
    if (ctrl) { return JSON.parse('"\\' + ctrl + '"'); }
    throw new Error('Bug: no group in match', m);
  }
  rx.eat = function (buf) { return buf.peekMark(rx, null, decode); };
  return rx;
}());





























module.exports = EX;
