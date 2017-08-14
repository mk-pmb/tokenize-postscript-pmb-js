#!/bin/sed -urf
# -*- coding: UTF-8, tab-width: 2 -*-

/^\s*\{ "t": " ",/n
/^\s*\{ "?t"?:/{
  /"/!s~'~"~g
  s~(\{|,)( +)([a-z]): ("|true|false|null|-?[0-9]+)~\1\2"\3": \4~g
  s~\}$~&,~
  s~, +("[xw]":)~,\t\t\t\t\f\1~g
  s~\t~                                                ~g
  s~^(.{40}) *\f("x":)~\1\2~
  s~^(.{52}) *\f("w":)~\1\2~
  s~ +\f~ ~g
}



