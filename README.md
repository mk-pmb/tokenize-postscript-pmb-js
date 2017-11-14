
<!--#echo json="package.json" key="name" underline="=" -->
tokenize-postscript-pmb
=======================
<!--/#echo -->

<!--#echo json="package.json" key="description" -->
Parse the subset of PostScript that I understand.
<!--/#echo -->


API
---

### Token Objects

Tokens are reported as objects that have some of these properties.

* `t`: [type symbol](src/types.symb2name.json).
  This is the only property that's always present on every token object.
* `v`: value.
* `x`: `true` if the object is executable,
  `'//'` if the object is to be executed immediately,
  `undefined` of some other false-y value for literal objects.
* `w`: Whitespace that was found in front of the token.

Upgraded versions include:
* `T`: The type name as string, or a false-y value for unsupported types.






Usage
-----

from [test/usage.js](test/usage.js):
&nbsp; &nbsp; &nbsp;
([input](test/input/usage.ps) &rarr; [result](test/expect/usage.tokens.json))

<!--#include file="test/usage.js" start="  //#u" stop="  //#r"
  outdent="  " code="javascript" -->
<!--#verbatim lncnt="12" -->
```javascript
var makeTokenizer = require('tokenize-postscript-pmb'),
  psCode = fixture('input/usage.ps'),
  parseOpt = { ignWsp: false },
  tokenize = makeTokenizer(psCode, parseOpt),
  tokens = tokenize(),
  expected = fixture.json('expect/usage.tokens'),
  equal = require('equal-pmb');

equal(tokenize.remainder(), '');
equal.lists(tokens, expected);
```
<!--/include-->






<!--#toc stop="scan" -->



Known issues
------------

* needs more/better tests and docs



Reference
---------

* Syntax: PostScript Language Reference Manual (PLRM, "red book")
  [version 3][plrm-v3], ch. 3.2 "Syntax".




&nbsp;


  [plrm-v3]: http://web.archive.org/web/20090205083652/http://partners.adobe.com:80/public/developer/en/ps/PLRM.pdf
  [ps-faq]: http://web.archive.org/web/20170720222605/https://en.wikibooks.org/wiki/PostScript_FAQ
  [ps-wp-2008]: http://web.archive.org/web/20081221010243/http://en.wikipedia.org/wiki/PostScript


License
-------
<!--#echo json="package.json" key=".license" -->
ISC
<!--/#echo -->
