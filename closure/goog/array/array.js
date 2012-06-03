// Copyright 2006 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Utilities for manipulating arrays.
 *
 */


goog.provide('goog.array');
goog.provide('goog.array.ArrayLike');

goog.require('goog.asserts');


/**
 * @define {boolean} NATIVE_ARRAY_PROTOTYPES true にすると Array.prototype の関
 * 数が利用可能であればそちらを利用する。false であれば利用しない。
 *
 * Array.prototype の関数群は Prototype のようなライブラリによって定義されている
 * 場合がある。この定数が false であれば Closure Library の goog.array による
 * 実装を使用する。
 *
 * 他のライブラリによるスクリプトが利用可能な状況で、それを利用したくない場合は
 * JSCompiler の引数を以下のように指定する。
 * "--define goog.NATIVE_ARRAY_PROTOTYPES=false"
 */
goog.NATIVE_ARRAY_PROTOTYPES = true;


/**
 * @typedef {Array|NodeList|Arguments|{length: number}}
 */
goog.array.ArrayLike;


/**
 * 最後の配列要素を返す。Array.prototype.push とは異なり最後の配列要素は削除され
 * ない。
 * @param {goog.array.ArrayLike} array 処理したい配列。
 * @return {*} 配列の最終要素。
 */
goog.array.peek = function(array) {
  return array[array.length - 1];
};


/**
 * 元の {@code Array.prototype} オブジェクトへの参照。
 * @private
 */
goog.array.ARRAY_PROTOTYPE_ = Array.prototype;


// 注記(arv): 配列の関数はたいてい配列の”ような”オブジェクトを処理できるように
// つくられている。たとえば String オブジェクトは length プロパティをもっている
// ので配列のようなオブジェクトである。しかしながら、ブラウサによっては[]による
// アクセスができないため in 演算子は String オブジェクトに利用できない。
// なので、我々は文字列は split で分割するようにした。


/**
 * 指定したオブジェクトと一致する最初の要素のインデックスを返す。
 * 一致する要素がない場合は -1 が返る。
 *
 * {@link http://tinyurl.com/developer-mozilla-org-array-indexof} を参照。
 *
 * @param {goog.array.ArrayLike} arr 検索される配列。
 * @param {*} obj 検索対象のオブジェクト。
 * @param {number=} opt_fromIndex 検索を始めるインデックス。省略時は 0 から検索
 * が始められる。
 * @return {number} 一致した最初の要素のインデックス。
 */
goog.array.indexOf = goog.NATIVE_ARRAY_PROTOTYPES &&
                     goog.array.ARRAY_PROTOTYPE_.indexOf ?
    function(arr, obj, opt_fromIndex) {
      goog.asserts.assert(arr.length != null);

      return goog.array.ARRAY_PROTOTYPE_.indexOf.call(arr, obj, opt_fromIndex);
    } :
    function(arr, obj, opt_fromIndex) {
      var fromIndex = opt_fromIndex == null ?
          0 : (opt_fromIndex < 0 ?
               Math.max(0, arr.length + opt_fromIndex) : opt_fromIndex);

      if (goog.isString(arr)) {
        // Array.prototype.indexOf は === を使うのだから文字列のみみつかるべき。
        if (!goog.isString(obj) || obj.length != 1) {
          return -1;
        }
        return arr.indexOf(obj, fromIndex);
      }

      for (var i = fromIndex; i < arr.length; i++) {
        if (i in arr && arr[i] === obj)
          return i;
      }
      return -1;
    };


/**
 * 指定したオブジェクトと一致する最後の要素のインデックスを返す。
 * 一致する要素がない場合は -1 が返る。
 *
 * {@link http://tinyurl.com/developer-mozilla-org-array-indexof} を参照。
 *
 * @param {goog.array.ArrayLike} arr 検索される配列。
 * @param {*} obj 検索対象のオブジェクト。
 * @param {number=} opt_fromIndex 検索を始めるインデックス。省略時は最後から検索
 * が始められる。
 * @return {number} 一致した最後の要素のインデックス。
 */
goog.array.lastIndexOf = goog.NATIVE_ARRAY_PROTOTYPES &&
                         goog.array.ARRAY_PROTOTYPE_.lastIndexOf ?
    function(arr, obj, opt_fromIndex) {
      goog.asserts.assert(arr.length != null);

      // Firefox は undefined と null を 0 のように扱うため常に -1 が返ってきて
      // しまうことがある。
      var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
      return goog.array.ARRAY_PROTOTYPE_.lastIndexOf.call(arr, obj, fromIndex);
    } :
    function(arr, obj, opt_fromIndex) {
      var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;

      if (fromIndex < 0) {
        fromIndex = Math.max(0, arr.length + fromIndex);
      }

      if (goog.isString(arr)) {
        // Array.prototype.indexOf は === を使うのだから文字列のみみつかるべき。
        if (!goog.isString(obj) || obj.length != 1) {
          return -1;
        }
        return arr.lastIndexOf(obj, fromIndex);
      }

      for (var i = fromIndex; i >= 0; i--) {
        if (i in arr && arr[i] === obj)
          return i;
      }
      return -1;
    };


/**
 * 配列の各要素毎に関数を実行する。
 *
 * {@link http://tinyurl.com/developer-mozilla-org-array-foreach} を参照。
 *
 * @param {goog.array.ArrayLike} arr 繰り返し処理したい配列か配列のようなオブ
 *     ジェクト。
 * @param {?function(this: T, ...)} f 各要素について実行される関数。
 *     この関数は要素の値・インデックス・走査している配列の 3 つの引数をとる。
 *     戻り値は無視される。この関数は値が設定された要素のみについて実行される。
 *     削除された値や値が一度も設定されていない要素については実行されない。
 * @param {T=} opt_obj f を実行する際の 'this' に設定されるオブジェクト。
 * @template T
 */
goog.array.forEach = goog.NATIVE_ARRAY_PROTOTYPES &&
                     goog.array.ARRAY_PROTOTYPE_.forEach ?
    function(arr, f, opt_obj) {
      goog.asserts.assert(arr.length != null);

      goog.array.ARRAY_PROTOTYPE_.forEach.call(arr, f, opt_obj);
    } :
    function(arr, f, opt_obj) {
      var l = arr.length;  // ループ中は固定されていなければならない。
      var arr2 = goog.isString(arr) ? arr.split('') : arr;
      for (var i = 0; i < l; i++) {
        if (i in arr2) {
          f.call(opt_obj, arr2[i], i, arr);
        }
      }
    };


/**
 * 配列の末尾から各要素毎に関数を実行する。
 *
 * @param {goog.array.ArrayLike} arr 繰り返し処理したい配列か配列のようなオブ
 *     ジェクト。
 * @param {?function(this: T, ...)} f 各要素について実行される関数。
 *     この関数は要素の値・インデックス・走査している配列の 3 つの引数をとる。
 *     戻り値は無視される。
 * @param {Object=} opt_obj f を実行する際の 'this' に設定されるオブジェクト。
 */
goog.array.forEachRight = function(arr, f, opt_obj) {
  var l = arr.length;  // ループ中は変化してはならない。
  var arr2 = goog.isString(arr) ? arr.split('') : arr;
  for (var i = l - 1; i >= 0; --i) {
    if (i in arr2) {
      f.call(opt_obj, arr2[i], i, arr);
    }
  }
};


/**
 * 配列の各要素毎に関数を実行し、戻り値が true であるときの要素からなる新しい配
 * 列を返す。
 *
 * {@link http://tinyurl.com/developer-mozilla-org-array-filter} を参照。
 *
 * @param {goog.array.ArrayLike} arr 繰り返し処理したい配列か配列のようなオブ
 *     ジェクト。
 * @param {Function} f 各要素について実行される関数。
 *     この関数は要素の値・インデックス・走査している配列の 3 つの引数をとり、
 *     戻り値は真偽値でなければならない。 true が返されたときの要素のみ新しい配
 *     列に追加され、 false が返されたときは要素を追加しない。
 * @param {Object=} opt_obj f を実行する際の 'this' に設定されるオブジェクト。
 * @return {!Array} 戻り値が true のときの要素からなる新しい配列。
 */
goog.array.filter = goog.NATIVE_ARRAY_PROTOTYPES &&
                    goog.array.ARRAY_PROTOTYPE_.filter ?
    function(arr, f, opt_obj) {
      goog.asserts.assert(arr.length != null);

      return goog.array.ARRAY_PROTOTYPE_.filter.call(arr, f, opt_obj);
    } :
    function(arr, f, opt_obj) {
      var l = arr.length;  // ループ中は変化してはならない。
      var res = [];
      var resLength = 0;
      var arr2 = goog.isString(arr) ? arr.split('') : arr;
      for (var i = 0; i < l; i++) {
        if (i in arr2) {
          var val = arr2[i];  // f は arr2 の要素を参照するようにする。
          if (f.call(opt_obj, val, i, arr)) {
            res[resLength++] = val;
          }
        }
      }
      return res;
    };


/**
 * 与えられた関数を配列のすべての要素に対して呼び出し、その結果からなる新しい配
 * 列を生成する。
 *
 * {@link http://tinyurl.com/developer-mozilla-org-array-map} を参照。
 *
 * @param {goog.array.ArrayLike} arr 走査対象の配列。
 * @param {Function} f 各要素について実行される関数。
 *     この関数は要素の値・インデックス・走査している配列の 3 つの引数をとり、
 *     戻り値を返さなければならない。 この戻り値が返される配列の要素となる。
 * @param {Object=} opt_obj f を実行する際の 'this' に設定されるオブジェクト。
 * @return {!Array} f の戻り値からなる新しい配列。
 */
goog.array.map = goog.NATIVE_ARRAY_PROTOTYPES &&
                 goog.array.ARRAY_PROTOTYPE_.map ?
    function(arr, f, opt_obj) {
      goog.asserts.assert(arr.length != null);

      return goog.array.ARRAY_PROTOTYPE_.map.call(arr, f, opt_obj);
    } :
    function(arr, f, opt_obj) {
      var l = arr.length;  // ループ中は変化してはならない。
      var res = new Array(l);
      var arr2 = goog.isString(arr) ? arr.split('') : arr;
      for (var i = 0; i < l; i++) {
        if (i in arr2) {
          res[i] = f.call(opt_obj, arr2[i], i, arr);
        }
      }
      return res;
    };


/**
 * 配列の各要素毎に関数を実行し、単一の結果を得る。
 *
 * {@link http://tinyurl.com/developer-mozilla-org-array-reduce} を参照。
 *
 * 例：
 * var a = [1, 2, 3, 4];
 * goog.array.reduce(a, function(r, v, i, arr) {return r + v;}, 0);
 * returns 10
 *
 * @param {goog.array.ArrayLike} arr 走査対象の配列。
 * @param {Function} f 各要素毎に実行される関数。この関数は前回の結果（または初
 *     期値）・今回の配列の要素・今回の要素のインデックス・走査している配列の 4
 *     つの引数をとる。つまり、引数は以下のようになる。
 *     function(previousValue, currentValue, index, array)
 * @param {*} val f が最初に実行されるときの previousValue の値。
 * @param {Object=} opt_obj  f を実行する際に 'this' に設定されるオブジェクト。
 * @return {*} この配列を f によって繰り返し評価した値。
 */
goog.array.reduce = function(arr, f, val, opt_obj) {
  if (arr.reduce) {
    if (opt_obj) {
      return arr.reduce(goog.bind(f, opt_obj), val);
    } else {
      return arr.reduce(f, val);
    }
  }
  var rval = val;
  goog.array.forEach(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr);
  });
  return rval;
};


/**
 * 配列の末尾から各要素毎に関数を実行し、単一の結果を得る。
 *
 * {@link http://tinyurl.com/developer-mozilla-org-array-reduceright} を参照。
 *
 * 例：
 * var a = ['a', 'b', 'c'];
 * goog.array.reduceRight(a, function(r, v, i, arr) {return r + v;}, '');
 * returns 'cba'
 *
 * @param {goog.array.ArrayLike} arr 走査対象の配列。
 * @param {Function} f 各要素毎に実行される関数。この関数は前回の結果（または初
 *     期値）・今回の配列の要素・今回の要素のインデックス・走査している配列の 4
 *     つの引数をとる。つまり、引数は以下のようになる。
 *     function(previousValue, currentValue, index, array)
 * @param {*} val f が最初に実行されるときの previousValue の値。
 * @param {Object=} opt_obj  f を実行する際に 'this' に設定されるオブジェクト。
 * @return {*} この配列を f によって繰り返し評価した値。
 */
goog.array.reduceRight = function(arr, f, val, opt_obj) {
  if (arr.reduceRight) {
    if (opt_obj) {
      return arr.reduceRight(goog.bind(f, opt_obj), val);
    } else {
      return arr.reduceRight(f, val);
    }
  }
  var rval = val;
  goog.array.forEachRight(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr);
  });
  return rval;
};


/**
 * f を各要素毎に実行し、 f の戻り値が true であれば直ちに true が返される（残り
 * の要素は評価されない）。 f の戻り値がすべて false であれば false が返される。
 *
 * {@link http://tinyurl.com/developer-mozilla-org-array-some} を参照。
 *
 * @param {goog.array.ArrayLike} arr チェック対象の配列。
 * @param {Function} f 各要素毎に実行される関数。
 *     この関数は配列の要素・インデックス・走査対象の配列の 3 つの引数をとり、
 *     真偽値を返さなければならない。
 * @param {Object=} opt_obj  f を実行する際に 'this' に設定されるオブジェクト。
 * @return {boolean} 戻り値に true のものがあれば true 。
 */
goog.array.some = goog.NATIVE_ARRAY_PROTOTYPES &&
                  goog.array.ARRAY_PROTOTYPE_.some ?
    function(arr, f, opt_obj) {
      goog.asserts.assert(arr.length != null);

      return goog.array.ARRAY_PROTOTYPE_.some.call(arr, f, opt_obj);
    } :
    function(arr, f, opt_obj) {
      var l = arr.length;  // ループ中は変化してはならない。
      var arr2 = goog.isString(arr) ? arr.split('') : arr;
      for (var i = 0; i < l; i++) {
        if (i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
          return true;
        }
      }
      return false;
    };


/**
 * f を各要素毎に実行し、 f の戻り値が false であれば直ちに false が返される（残
 * りの要素は評価されない）。 f の戻り値がすべて true であれば true が返され
 * る。
 *
 * {@link http://tinyurl.com/developer-mozilla-org-array-every} を参照。
 *
 * @param {goog.array.ArrayLike} arr チェック対象の配列。
 * @param {Function} f 各要素毎に実行される関数。
 *     この関数は配列の要素・インデックス・走査対象の配列の 3 つの引数をとり、
 *     真偽値を返さなければならない。
 * @param {Object=} opt_obj  f を実行する際に 'this' に設定されるオブジェクト。
 * @return {boolean} 戻り値に false のものがあれば false 。
 */
goog.array.every = goog.NATIVE_ARRAY_PROTOTYPES &&
                   goog.array.ARRAY_PROTOTYPE_.every ?
    function(arr, f, opt_obj) {
      goog.asserts.assert(arr.length != null);

      return goog.array.ARRAY_PROTOTYPE_.every.call(arr, f, opt_obj);
    } :
    function(arr, f, opt_obj) {
      var l = arr.length;  // ループ中は変化してはならない。
      var arr2 = goog.isString(arr) ? arr.split('') : arr;
      for (var i = 0; i < l; i++) {
        if (i in arr2 && !f.call(opt_obj, arr2[i], i, arr)) {
          return false;
        }
      }
      return true;
    };


/**
 * 与えられた条件を満足する最初の要素を返す。
 * @param {goog.array.ArrayLike} arr 検索される配列。
 * @param {Function} f 各要素毎に実行される関数。
 *     この関数は配列の要素・インデックス・走査対象の配列の 3 つの引数をとり、
 *     真偽値を返すべきである。
 * @param {Object=} opt_obj f の実行時に 'this' に設定されるオブジェクト。
 * @return {*} 条件を満足した最初の要素。条件を満足する要素がなければ null 。
 */
goog.array.find = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i];
};


/**
 * 与えられた条件を満足する最初の要素のインデックスを返す。
 * @param {goog.array.ArrayLike} arr 検索される配列。
 * @param {Function} f 各要素毎に実行される関数。
 *     この関数は配列の要素・インデックス・走査対象の配列の 3 つの引数をとり、
 *     真偽値を返すべきである。
 * @param {Object=} opt_obj f の実行時に 'this' に設定されるオブジェクト。
 * @return {*} 条件を満足した最初の要素のインデックス。条件を満足する要素がなけ
 *     れば -1 。
 */
goog.array.findIndex = function(arr, f, opt_obj) {
  var l = arr.length;  // ループ中は変化してはならない。
  var arr2 = goog.isString(arr) ? arr.split('') : arr;
  for (var i = 0; i < l; i++) {
    if (i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i;
    }
  }
  return -1;
};


/**
 * 与えられた条件を満足する最後の要素を返す（goog.array.find を逆順に実行）。
 * @param {goog.array.ArrayLike} arr The array to search.
 * @param {Function} f 各要素毎に実行される関数。
 *     この関数は配列の要素・インデックス・走査対象の配列の 3 つの引数をとり、
 *     真偽値を返すべきである。
 * @param {Object=} opt_obj f の実行時に 'this' に設定されるオブジェクト。
 * @return {*} 条件を満足した最後の要素。条件を満足する要素がなければ null 。
 */
goog.array.findRight = function(arr, f, opt_obj) {
  var i = goog.array.findIndexRight(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i];
};


/**
 * 与えられた条件を満足する最後の要素のインデックスを返す（goog.array.findIndex
 * を逆順に実行）。
 * @param {goog.array.ArrayLike} arr The array to search.
 * @param {Function} f 各要素毎に実行される関数。
 *     この関数は配列の要素・インデックス・走査対象の配列の 3 つの引数をとり、
 *     真偽値を返すべきである。
 * @param {Object=} opt_obj f の実行時に 'this' に設定されるオブジェクト。
 * @return {*} 条件を満足した最後の要素のインデックス。条件を満足する要素がなけ
 *     れば -1 。
 */
goog.array.findIndexRight = function(arr, f, opt_obj) {
  var l = arr.length;  // ループ中は変化してはならない。
  var arr2 = goog.isString(arr) ? arr.split('') : arr;
  for (var i = l - 1; i >= 0; i--) {
    if (i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i;
    }
  }
  return -1;
};


/**
 * 与えられた要素が配列に含まれているかを判定する。
 * @param {goog.array.ArrayLike} arr 要素が含まれているか判定したい配列。
 * @param {*} obj 判定したい要素。
 * @return {boolean} 要素が含まれていれば true 。
 */
goog.array.contains = function(arr, obj) {
  return goog.array.indexOf(arr, obj) >= 0;
};


/**
 * 配列が空かどうかを判定する。
 * @param {goog.array.ArrayLike} arr 判定したい配列。
 * @return {boolean} 空であれば true 。 
 */
goog.array.isEmpty = function(arr) {
  return arr.length == 0;
};


/**
 * 配列の全要素を消去する。
 * @param {goog.array.ArrayLike} arr 初期化したい配列または配列のようなオブジェ
 *     クト。
 */
goog.array.clear = function(arr) {
  // 本物の配列でなければ {@code *.length = 0} みたいな方法が存在しないので、イ
  // ンデックス毎に削除することにした。
  if (!goog.isArray(arr)) {
    for (var i = arr.length - 1; i >= 0; i--) {
      delete arr[i];
    }
  }
  arr.length = 0;
};


/**
 * 与えられた要素が配列に含まれていなければ、その要素を末尾に追加する。
 * @param {Array} arr 挿入したい配列。
 * @param {*} obj 加えたい値。
 */
goog.array.insert = function(arr, obj) {
  if (!goog.array.contains(arr, obj)) {
    arr.push(obj);
  }
};


/**
 * 与えられたインデックスの位置に要素を挿入する。
 * @param {goog.array.ArrayLike} arr 変更される配列。
 * @param {*} obj 挿入される要素。
 * @param {number=} opt_i 要素を挿入したい位置のインデックス。省略時は 0 とみな
 * 　  される。値が負の場合は末尾からカウントする。
 */
goog.array.insertAt = function(arr, obj, opt_i) {
  goog.array.splice(arr, opt_i, 0, obj);
};


/**
 * 与えられたインデックスの位置に配列の全要素を挿入する。
 * @param {goog.array.ArrayLike} arr 変更される配列。
 * @param {goog.array.ArrayLike} elementsToAdd 挿入される要素の配列。
 * @param {number=} opt_i 要素を挿入したい位置のインデックス。省略時は 0 とみな
 * 　  される。値が負の場合は末尾からカウントする。
 */
goog.array.insertArrayAt = function(arr, elementsToAdd, opt_i) {
  goog.partial(goog.array.splice, arr, opt_i, 0).apply(null, elementsToAdd);
};


/**
 * 与えられたオブジェクトの前に要素を挿入する。
 * @param {Array} arr 変更される配列。
 * @param {*} obj 挿入される要素。
 * @param {*=} opt_obj2 この要素の直後に要素が挿入される。もし、 obj2 を省略、ま
 *     たは見つからない場合、 obj は配列の末尾に追加される。
 */
goog.array.insertBefore = function(arr, obj, opt_obj2) {
  var i;
  if (arguments.length == 2 || (i = goog.array.indexOf(arr, opt_obj2)) < 0) {
    arr.push(obj);
  } else {
    goog.array.insertAt(arr, obj, i);
  }
};


/**
 * 与えられた要素と最初に一致した要素を削除する。
 * @param {goog.array.ArrayLike} arr 削除したい要素が含まれている配列。
 * @param {*} obj 削除したい要素。
 * @return {boolean} 要素を削除した場合は true 。
 */
goog.array.remove = function(arr, obj) {
  var i = goog.array.indexOf(arr, obj);
  var rv;
  if ((rv = i >= 0)) {
    goog.array.removeAt(arr, i);
  }
  return rv;
};


/**
 * 与えられたインデックスの要素を削除する。
 * @param {goog.array.ArrayLike} arr 削除したい要素が含まれている配列または配列
 *     のようなオブジェクト。
 * @param {number} i 削除したい要素のインデックス。
 * @return {boolean} 要素を削除した場合は true 。
 */
goog.array.removeAt = function(arr, i) {
  goog.asserts.assert(arr.length != null);

  // use generic form of splice
  // splice returns the removed items and if successful the length of that
  // will be 1
  return goog.array.ARRAY_PROTOTYPE_.splice.call(arr, i, 1).length == 1;
};


/**
 * 与えられた条件を満足した最初の要素を削除する。
 * @param {goog.array.ArrayLike} arr 削除したい要素の含まれている配列。
 * @param {Function} f 各要素毎に実行される関数。
 *     この関数は配列の要素・インデックス・走査対象の配列の 3 つの引数をとり、
 *     真偽値を返すべきである。
 * @param {Object=} opt_obj f の実行時に 'this' に設定されるオブジェクト。
 * @return {boolean} 要素を削除した場合は true 。
 */
goog.array.removeIf = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  if (i >= 0) {
    goog.array.removeAt(arr, i);
    return true;
  }
  return false;
};


/**
 * 与えられたすべての引数を結合した新しい配列を返す。引数が配列の場合はその要素
 * が新しい配列に追加され、引数が配列でない場合は引数そのものが新しい配列に追加
 * される。
 *
 * 注記： 配列のようなオブジェクトについては、その要素ではなく配列のようなオブ
 * ジェクトそのものが追加される。
 *
 * goog.array.concat([1, 2], [3, 4]) -> [1, 2, 3, 4]
 * goog.array.concat(0, [1, 2]) -> [0, 1, 2]
 * goog.array.concat([1, 2], null) -> [1, 2, null]
 *
 * IE のバージョン 6 〜 8 には、 iframe のなかで配列が作成されてから少し経って
 * iframe が破壊されるというバグが存在する（配列の作成直後ではない）。このバグは
 * {@link goog.net.IframeIo} によってデータを読み込んだ場合でも生じる。
 * このバグは concat メソッドのみのもので、concat メソッドは致命的なエラー
 * (#-2147418113) をあげ始める。
 *
 * http://endoflow.com/scratch/corrupted-arrays.html のテストケースを参照（2012
 * 年6月現在デッドリンク。WayBack Machine にアーカイブなし）。
 *
 * 内部的にはこれを使う可能性があるので、すべてのメソッドはこれらの壊れた配列を
 * 扱えるように修正する必要がある。
 *
 * @param {...*} var_args 結合したいオブジェクト。 配列の場合は各要素が追加され
 *     る。プリミティブな値やオブジェクトはそのものが追加される。
 * @return {!Array} 結合された新しい配列。
 */
goog.array.concat = function(var_args) {
  return goog.array.ARRAY_PROTOTYPE_.concat.apply(
      goog.array.ARRAY_PROTOTYPE_, arguments);
};


/**
 * 与えられたオブジェクトを配列に変換する。
 * @param {goog.array.ArrayLike} object 配列に変換したいオブジェクト。
 * @return {!Array} オブジェクトを変換した配列。オブジェクトが length プロパティ
 *     を持つ場合、正の値のインデックスを持つすべての要素は追加される。
 *     もしオブジェクトが length プロパティをもたない場合、空配列が返される。
 */
goog.array.toArray = function(object) {
  var length = object.length;

  // もし length が数値でない場合にこの式は false を返す。この場合は配列のようで
  // ないオブジェクトを渡す関数のために後方互換性を保つ。
  if (length > 0) {
    var rv = new Array(length);
    for (var i = 0; i < length; i++) {
      rv[i] = object[i];
    }
    return rv;
  }
  return [];
};


/**
 * 配列をシャローコピー（浅いコピー：配列はコピーされるが要素の参照は変わらな
 * い）する。
 * @param {goog.array.ArrayLike} arr シャローコピーされる配列。
 * @return {!Array} 与えられた配列のコピー。
 */
goog.array.clone = goog.array.toArray;


/**
 * 配列または配列のようなオブジェクトに与えられたオブジェクトを破壊的に追加す
 * る。このメソッドは破壊的なので新しい配列は作成されない。
 *
 * Example:
 * var a = [];
 * goog.array.extend(a, [0, 1]);
 * a; // [0, 1]
 * goog.array.extend(a, 2);
 * a; // [0, 1, 2]
 *
 * @param {Array} arr1 変更される配列。
 * @param {...*} var_args arr1 に追加されるオブジェクトまたは配列。配列の場合は
 *     要素が追加される。
 */
goog.array.extend = function(arr1, var_args) {
  for (var i = 1; i < arguments.length; i++) {
    var arr2 = arguments[i];
    // もし、配列または Arguments オブジェクトであれば push を呼び出せばよい。
    var isArrayLike;
    if (goog.isArray(arr2) ||
        // Arguments オブジェクトかどうかを判定。ECMA Script 5 では、[[Class]]
        // となるが、 V8・JSC・Safari は "Arguments" を返す。なので、配列のよう
        // なオブジェクトかどうかを判定した上で callee プロパティの存在によって
        // 判定することにした。
        (isArrayLike = goog.isArrayLike(arr2)) &&
            // ECMA Script の 10.6 節によれば callee のゲッターは strict モード
            // で警告される。なので、このように確かめることにした。
            arr2.hasOwnProperty('callee')) {
      arr1.push.apply(arr1, arr2);

    } else if (isArrayLike) {
      // それ以外の場合はオブジェクトのコピーを防ぐためにループさせてコピーす
      // る。
      var len1 = arr1.length;
      var len2 = arr2.length;
      for (var j = 0; j < len2; j++) {
        arr1[len1 + j] = arr2[j];
      }
    } else {
      arr1.push(arr2);
    }
  }
};


/**
 * Adds or removes elements from an array. This is a generic version of Array
 * splice. This means that it might work on other objects similar to arrays,
 * such as the arguments object.
 *
 * @param {goog.array.ArrayLike} arr The array to modify.
 * @param {number|undefined} index The index at which to start changing the
 *     array. If not defined, treated as 0.
 * @param {number} howMany How many elements to remove (0 means no removal. A
 *     value below 0 is treated as zero and so is any other non number. Numbers
 *     are floored).
 * @param {...*} var_args Optional, additional elements to insert into the
 *     array.
 * @return {!Array} the removed elements.
 */
goog.array.splice = function(arr, index, howMany, var_args) {
  goog.asserts.assert(arr.length != null);

  return goog.array.ARRAY_PROTOTYPE_.splice.apply(
      arr, goog.array.slice(arguments, 1));
};


/**
 * Returns a new array from a segment of an array. This is a generic version of
 * Array slice. This means that it might work on other objects similar to
 * arrays, such as the arguments object.
 *
 * @param {goog.array.ArrayLike} arr The array from which to copy a segment.
 * @param {number} start The index of the first element to copy.
 * @param {number=} opt_end The index after the last element to copy.
 * @return {!Array} A new array containing the specified segment of the original
 *     array.
 */
goog.array.slice = function(arr, start, opt_end) {
  goog.asserts.assert(arr.length != null);

  // passing 1 arg to slice is not the same as passing 2 where the second is
  // null or undefined (in that case the second argument is treated as 0).
  // we could use slice on the arguments object and then use apply instead of
  // testing the length
  if (arguments.length <= 2) {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start);
  } else {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start, opt_end);
  }
};


/**
 * Removes all duplicates from an array (retaining only the first
 * occurrence of each array element).  This function modifies the
 * array in place and doesn't change the order of the non-duplicate items.
 *
 * For objects, duplicates are identified as having the same unique ID as
 * defined by {@link goog.getUid}.
 *
 * Runtime: N,
 * Worstcase space: 2N (no dupes)
 *
 * @param {goog.array.ArrayLike} arr The array from which to remove duplicates.
 * @param {Array=} opt_rv An optional array in which to return the results,
 *     instead of performing the removal inplace.  If specified, the original
 *     array will remain unchanged.
 */
goog.array.removeDuplicates = function(arr, opt_rv) {
  var returnArray = opt_rv || arr;

  var seen = {}, cursorInsert = 0, cursorRead = 0;
  while (cursorRead < arr.length) {
    var current = arr[cursorRead++];

    // Prefix each type with a single character representing the type to
    // prevent conflicting keys (e.g. true and 'true').
    var key = goog.isObject(current) ?
        'o' + goog.getUid(current) :
        (typeof current).charAt(0) + current;

    if (!Object.prototype.hasOwnProperty.call(seen, key)) {
      seen[key] = true;
      returnArray[cursorInsert++] = current;
    }
  }
  returnArray.length = cursorInsert;
};


/**
 * Searches the specified array for the specified target using the binary
 * search algorithm.  If no opt_compareFn is specified, elements are compared
 * using <code>goog.array.defaultCompare</code>, which compares the elements
 * using the built in < and > operators.  This will produce the expected
 * behavior for homogeneous arrays of String(s) and Number(s). The array
 * specified <b>must</b> be sorted in ascending order (as defined by the
 * comparison function).  If the array is not sorted, results are undefined.
 * If the array contains multiple instances of the specified target value, any
 * of these instances may be found.
 *
 * Runtime: O(log n)
 *
 * @param {goog.array.ArrayLike} arr The array to be searched.
 * @param {*} target The sought value.
 * @param {Function=} opt_compareFn Optional comparison function by which the
 *     array is ordered. Should take 2 arguments to compare, and return a
 *     negative number, zero, or a positive number depending on whether the
 *     first argument is less than, equal to, or greater than the second.
 * @return {number} Lowest index of the target value if found, otherwise
 *     (-(insertion point) - 1). The insertion point is where the value should
 *     be inserted into arr to preserve the sorted property.  Return value >= 0
 *     iff target is found.
 */
goog.array.binarySearch = function(arr, target, opt_compareFn) {
  return goog.array.binarySearch_(arr,
      opt_compareFn || goog.array.defaultCompare, false /* isEvaluator */,
      target);
};


/**
 * Selects an index in the specified array using the binary search algorithm.
 * The evaluator receives an element and determines whether the desired index
 * is before, at, or after it.  The evaluator must be consistent (formally,
 * goog.array.map(goog.array.map(arr, evaluator, opt_obj), goog.math.sign)
 * must be monotonically non-increasing).
 *
 * Runtime: O(log n)
 *
 * @param {goog.array.ArrayLike} arr The array to be searched.
 * @param {Function} evaluator Evaluator function that receives 3 arguments
 *     (the element, the index and the array). Should return a negative number,
 *     zero, or a positive number depending on whether the desired index is
 *     before, at, or after the element passed to it.
 * @param {Object=} opt_obj The object to be used as the value of 'this'
 *     within evaluator.
 * @return {number} Index of the leftmost element matched by the evaluator, if
 *     such exists; otherwise (-(insertion point) - 1). The insertion point is
 *     the index of the first element for which the evaluator returns negative,
 *     or arr.length if no such element exists. The return value is non-negative
 *     iff a match is found.
 */
goog.array.binarySelect = function(arr, evaluator, opt_obj) {
  return goog.array.binarySearch_(arr, evaluator, true /* isEvaluator */,
      undefined /* opt_target */, opt_obj);
};


/**
 * Implementation of a binary search algorithm which knows how to use both
 * comparison functions and evaluators. If an evaluator is provided, will call
 * the evaluator with the given optional data object, conforming to the
 * interface defined in binarySelect. Otherwise, if a comparison function is
 * provided, will call the comparison function against the given data object.
 *
 * This implementation purposefully does not use goog.bind or goog.partial for
 * performance reasons.
 *
 * Runtime: O(log n)
 *
 * @param {goog.array.ArrayLike} arr The array to be searched.
 * @param {Function} compareFn Either an evaluator or a comparison function,
 *     as defined by binarySearch and binarySelect above.
 * @param {boolean} isEvaluator Whether the function is an evaluator or a
 *     comparison function.
 * @param {*=} opt_target If the function is a comparison function, then this is
 *     the target to binary search for.
 * @param {Object=} opt_selfObj If the function is an evaluator, this is an
  *    optional this object for the evaluator.
 * @return {number} Lowest index of the target value if found, otherwise
 *     (-(insertion point) - 1). The insertion point is where the value should
 *     be inserted into arr to preserve the sorted property.  Return value >= 0
 *     iff target is found.
 * @private
 */
goog.array.binarySearch_ = function(arr, compareFn, isEvaluator, opt_target,
    opt_selfObj) {
  var left = 0;  // inclusive
  var right = arr.length;  // exclusive
  var found;
  while (left < right) {
    var middle = (left + right) >> 1;
    var compareResult;
    if (isEvaluator) {
      compareResult = compareFn.call(opt_selfObj, arr[middle], middle, arr);
    } else {
      compareResult = compareFn(opt_target, arr[middle]);
    }
    if (compareResult > 0) {
      left = middle + 1;
    } else {
      right = middle;
      // We are looking for the lowest index so we can't return immediately.
      found = !compareResult;
    }
  }
  // left is the index if found, or the insertion point otherwise.
  // ~left is a shorthand for -left - 1.
  return found ? left : ~left;
};


/**
 * Sorts the specified array into ascending order.  If no opt_compareFn is
 * specified, elements are compared using
 * <code>goog.array.defaultCompare</code>, which compares the elements using
 * the built in < and > operators.  This will produce the expected behavior
 * for homogeneous arrays of String(s) and Number(s), unlike the native sort,
 * but will give unpredictable results for heterogenous lists of strings and
 * numbers with different numbers of digits.
 *
 * This sort is not guaranteed to be stable.
 *
 * Runtime: Same as <code>Array.prototype.sort</code>
 *
 * @param {Array} arr The array to be sorted.
 * @param {Function=} opt_compareFn Optional comparison function by which the
 *     array is to be ordered. Should take 2 arguments to compare, and return a
 *     negative number, zero, or a positive number depending on whether the
 *     first argument is less than, equal to, or greater than the second.
 */
goog.array.sort = function(arr, opt_compareFn) {
  // TODO(arv): Update type annotation since null is not accepted.
  goog.asserts.assert(arr.length != null);

  goog.array.ARRAY_PROTOTYPE_.sort.call(
      arr, opt_compareFn || goog.array.defaultCompare);
};


/**
 * Sorts the specified array into ascending order in a stable way.  If no
 * opt_compareFn is specified, elements are compared using
 * <code>goog.array.defaultCompare</code>, which compares the elements using
 * the built in < and > operators.  This will produce the expected behavior
 * for homogeneous arrays of String(s) and Number(s).
 *
 * Runtime: Same as <code>Array.prototype.sort</code>, plus an additional
 * O(n) overhead of copying the array twice.
 *
 * @param {Array} arr The array to be sorted.
 * @param {function(*, *): number=} opt_compareFn Optional comparison function
 *     by which the array is to be ordered. Should take 2 arguments to compare,
 *     and return a negative number, zero, or a positive number depending on
 *     whether the first argument is less than, equal to, or greater than the
 *     second.
 */
goog.array.stableSort = function(arr, opt_compareFn) {
  for (var i = 0; i < arr.length; i++) {
    arr[i] = {index: i, value: arr[i]};
  }
  var valueCompareFn = opt_compareFn || goog.array.defaultCompare;
  function stableCompareFn(obj1, obj2) {
    return valueCompareFn(obj1.value, obj2.value) || obj1.index - obj2.index;
  };
  goog.array.sort(arr, stableCompareFn);
  for (var i = 0; i < arr.length; i++) {
    arr[i] = arr[i].value;
  }
};


/**
 * Sorts an array of objects by the specified object key and compare
 * function. If no compare function is provided, the key values are
 * compared in ascending order using <code>goog.array.defaultCompare</code>.
 * This won't work for keys that get renamed by the compiler. So use
 * {'foo': 1, 'bar': 2} rather than {foo: 1, bar: 2}.
 * @param {Array.<Object>} arr An array of objects to sort.
 * @param {string} key The object key to sort by.
 * @param {Function=} opt_compareFn The function to use to compare key
 *     values.
 */
goog.array.sortObjectsByKey = function(arr, key, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  goog.array.sort(arr, function(a, b) {
    return compare(a[key], b[key]);
  });
};


/**
 * Tells if the array is sorted.
 * @param {!Array} arr The array.
 * @param {Function=} opt_compareFn Function to compare the array elements.
 *     Should take 2 arguments to compare, and return a negative number, zero,
 *     or a positive number depending on whether the first argument is less
 *     than, equal to, or greater than the second.
 * @param {boolean=} opt_strict If true no equal elements are allowed.
 * @return {boolean} Whether the array is sorted.
 */
goog.array.isSorted = function(arr, opt_compareFn, opt_strict) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  for (var i = 1; i < arr.length; i++) {
    var compareResult = compare(arr[i - 1], arr[i]);
    if (compareResult > 0 || compareResult == 0 && opt_strict) {
      return false;
    }
  }
  return true;
};


/**
 * Compares two arrays for equality. Two arrays are considered equal if they
 * have the same length and their corresponding elements are equal according to
 * the comparison function.
 *
 * @param {goog.array.ArrayLike} arr1 The first array to compare.
 * @param {goog.array.ArrayLike} arr2 The second array to compare.
 * @param {Function=} opt_equalsFn Optional comparison function.
 *     Should take 2 arguments to compare, and return true if the arguments
 *     are equal. Defaults to {@link goog.array.defaultCompareEquality} which
 *     compares the elements using the built-in '===' operator.
 * @return {boolean} Whether the two arrays are equal.
 */
goog.array.equals = function(arr1, arr2, opt_equalsFn) {
  if (!goog.isArrayLike(arr1) || !goog.isArrayLike(arr2) ||
      arr1.length != arr2.length) {
    return false;
  }
  var l = arr1.length;
  var equalsFn = opt_equalsFn || goog.array.defaultCompareEquality;
  for (var i = 0; i < l; i++) {
    if (!equalsFn(arr1[i], arr2[i])) {
      return false;
    }
  }
  return true;
};


/**
 * @deprecated Use {@link goog.array.equals}.
 * @param {goog.array.ArrayLike} arr1 {@link goog.array.equals} を参照。
 * @param {goog.array.ArrayLike} arr2 {@link goog.array.equals} を参照。
 * @param {Function=} opt_equalsFn {@link goog.array.equals} を参照。
 * @return {boolean} {@link goog.array.equals} を参照。
 */
goog.array.compare = function(arr1, arr2, opt_equalsFn) {
  return goog.array.equals(arr1, arr2, opt_equalsFn);
};


/**
 * 3-way array compare function.
 * @param {!goog.array.ArrayLike} arr1 The first array to compare.
 * @param {!goog.array.ArrayLike} arr2 The second array to compare.
 * @param {(function(*, *): number)=} opt_compareFn Optional comparison function
 *     by which the array is to be ordered. Should take 2 arguments to compare,
 *     and return a negative number, zero, or a positive number depending on
 *     whether the first argument is less than, equal to, or greater than the
 *     second.
 * @return {number} Negative number, zero, or a positive number depending on
 *     whether the first argument is less than, equal to, or greater than the
 *     second.
 */
goog.array.compare3 = function(arr1, arr2, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  var l = Math.min(arr1.length, arr2.length);
  for (var i = 0; i < l; i++) {
    var result = compare(arr1[i], arr2[i]);
    if (result != 0) {
      return result;
    }
  }
  return goog.array.defaultCompare(arr1.length, arr2.length);
};


/**
 * Compares its two arguments for order, using the built in < and >
 * operators.
 * @param {*} a The first object to be compared.
 * @param {*} b The second object to be compared.
 * @return {number} A negative number, zero, or a positive number as the first
 *     argument is less than, equal to, or greater than the second.
 */
goog.array.defaultCompare = function(a, b) {
  return a > b ? 1 : a < b ? -1 : 0;
};


/**
 * Compares its two arguments for equality, using the built in === operator.
 * @param {*} a The first object to compare.
 * @param {*} b The second object to compare.
 * @return {boolean} True if the two arguments are equal, false otherwise.
 */
goog.array.defaultCompareEquality = function(a, b) {
  return a === b;
};


/**
 * Inserts a value into a sorted array. The array is not modified if the
 * value is already present.
 * @param {Array} array The array to modify.
 * @param {*} value The object to insert.
 * @param {Function=} opt_compareFn Optional comparison function by which the
 *     array is ordered. Should take 2 arguments to compare, and return a
 *     negative number, zero, or a positive number depending on whether the
 *     first argument is less than, equal to, or greater than the second.
 * @return {boolean} True if an element was inserted.
 */
goog.array.binaryInsert = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  if (index < 0) {
    goog.array.insertAt(array, value, -(index + 1));
    return true;
  }
  return false;
};


/**
 * Removes a value from a sorted array.
 * @param {Array} array The array to modify.
 * @param {*} value The object to remove.
 * @param {Function=} opt_compareFn Optional comparison function by which the
 *     array is ordered. Should take 2 arguments to compare, and return a
 *     negative number, zero, or a positive number depending on whether the
 *     first argument is less than, equal to, or greater than the second.
 * @return {boolean} True if an element was removed.
 */
goog.array.binaryRemove = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  return (index >= 0) ? goog.array.removeAt(array, index) : false;
};


/**
 * Splits an array into disjoint buckets according to a splitting function.
 * @param {Array} array The array.
 * @param {Function} sorter Function to call for every element.  This
 *     takes 3 arguments (the element, the index and the array) and must
 *     return a valid object key (a string, number, etc), or undefined, if
 *     that object should not be placed in a bucket.
 * @return {!Object} An object, with keys being all of the unique return values
 *     of sorter, and values being arrays containing the items for
 *     which the splitter returned that key.
 */
goog.array.bucket = function(array, sorter) {
  var buckets = {};

  for (var i = 0; i < array.length; i++) {
    var value = array[i];
    var key = sorter(value, i, array);
    if (goog.isDef(key)) {
      // Push the value to the right bucket, creating it if necessary.
      var bucket = buckets[key] || (buckets[key] = []);
      bucket.push(value);
    }
  }

  return buckets;
};


/**
 * Returns an array consisting of the given value repeated N times.
 *
 * @param {*} value The value to repeat.
 * @param {number} n The repeat count.
 * @return {!Array} An array with the repeated value.
 */
goog.array.repeat = function(value, n) {
  var array = [];
  for (var i = 0; i < n; i++) {
    array[i] = value;
  }
  return array;
};


/**
 * Returns an array consisting of every argument with all arrays
 * expanded in-place recursively.
 *
 * @param {...*} var_args The values to flatten.
 * @return {!Array.<*>} An array containing the flattened values.
 */
goog.array.flatten = function(var_args) {
  var result = [];
  for (var i = 0; i < arguments.length; i++) {
    var element = arguments[i];
    if (goog.isArray(element)) {
      result.push.apply(result, goog.array.flatten.apply(null, element));
    } else {
      result.push(element);
    }
  }
  return result;
};


/**
 * Rotates an array in-place. After calling this method, the element at
 * index i will be the element previously at index (i - n) %
 * array.length, for all values of i between 0 and array.length - 1,
 * inclusive.
 *
 * For example, suppose list comprises [t, a, n, k, s]. After invoking
 * rotate(array, 1) (or rotate(array, -4)), array will comprise [s, t, a, n, k].
 *
 * @param {!Array.<*>} array The array to rotate.
 * @param {number} n The amount to rotate.
 * @return {!Array.<*>} The array.
 */
goog.array.rotate = function(array, n) {
  goog.asserts.assert(array.length != null);

  if (array.length) {
    n %= array.length;
    if (n > 0) {
      goog.array.ARRAY_PROTOTYPE_.unshift.apply(array, array.splice(-n, n));
    } else if (n < 0) {
      goog.array.ARRAY_PROTOTYPE_.push.apply(array, array.splice(0, -n));
    }
  }
  return array;
};


/**
 * Creates a new array for which the element at position i is an array of the
 * ith element of the provided arrays.  The returned array will only be as long
 * as the shortest array provided; additional values are ignored.  For example,
 * the result of zipping [1, 2] and [3, 4, 5] is [[1,3], [2, 4]].
 *
 * This is similar to the zip() function in Python.  See {@link
 * http://docs.python.org/library/functions.html#zip}
 *
 * @param {...!goog.array.ArrayLike} var_args Arrays to be combined.
 * @return {!Array.<!Array>} A new array of arrays created from provided arrays.
 */
goog.array.zip = function(var_args) {
  if (!arguments.length) {
    return [];
  }
  var result = [];
  for (var i = 0; true; i++) {
    var value = [];
    for (var j = 0; j < arguments.length; j++) {
      var arr = arguments[j];
      // If i is larger than the array length, this is the shortest array.
      if (i >= arr.length) {
        return result;
      }
      value.push(arr[i]);
    }
    result.push(value);
  }
};


/**
 * Shuffles the values in the specified array using the Fisher-Yates in-place
 * shuffle (also known as the Knuth Shuffle). By default, calls Math.random()
 * and so resets the state of that random number generator. Similarly, may reset
 * the state of the any other specified random number generator.
 *
 * Runtime: O(n)
 *
 * @param {!Array} arr The array to be shuffled.
 * @param {Function=} opt_randFn Optional random function to use for shuffling.
 *     Takes no arguments, and returns a random number on the interval [0, 1).
 *     Defaults to Math.random() using JavaScript's built-in Math library.
 */
goog.array.shuffle = function(arr, opt_randFn) {
  var randFn = opt_randFn || Math.random;

  for (var i = arr.length - 1; i > 0; i--) {
    // Choose a random array index in [0, i] (inclusive with i).
    var j = Math.floor(randFn() * (i + 1));

    var tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
};
