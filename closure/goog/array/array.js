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
 * @fileoverview 配列を走査するためのユーティリティ。
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
 * iframe が破壊されるというバグが存在する（配列の作成直後ではない）。
 * {@link goog.net.IframeIo} によってデータを読み込んだ場合でも生じうる。
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
 * 例：
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
 * 要素を配列に追加または配列から削除する。これは標準的な Array splice なので
 * Arguments のような配列のようなオブジェクトでも同様に動作すると思われる。
 *
 * @param {goog.array.ArrayLike} arr 変更される配列。
 * @param {number|undefined} index 配列を変更する範囲の最初のインデックス。もし
 *     定義されていない場合は 0 とみなされる。
 * @param {number} howMany 削除する要素の数。0 であれば削除しない。負の値や数値
 *     でない場合は 0 として処理される。小数は切り捨てられる。
 * @param {...*} var_args 追加する要素。省略可能。
 * @return {!Array} 削除された要素の配列。
 */
goog.array.splice = function(arr, index, howMany, var_args) {
  goog.asserts.assert(arr.length != null);

  return goog.array.ARRAY_PROTOTYPE_.splice.apply(
      arr, goog.array.slice(arguments, 1));
};


/**
 * 配列の一部分からなる新しい配列を返す。これは標準的な Array slice と同様の振る
 * 舞いをするので Arguments のような配列のようなオブジェクトでも同様に動作すると
 * 思われる。
 *
 * @param {goog.array.ArrayLike} arr 一部分を複製したい配列。
 * @param {number} start 複製する範囲の最初のインデックス。
 * @param {number=} opt_end 複製する範囲の最後のインデックス。
 * @return {!Array} 与えられた配列の一部分からなる新しい配列。
 */
goog.array.slice = function(arr, start, opt_end) {
  goog.asserts.assert(arr.length != null);

  // 引数が 1 つの場合と 2 つの場合では挙動が異なる。後者は 第二引数が null か
  // undefined とみなされる（つまり 0 とみなされる）。 apply の代わりに引数の数
  // を確かめることでArguments オブジェクトにも slice を使うことができる。
  if (arguments.length <= 2) {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start);
  } else {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start, opt_end);
  }
};


/**
 * 重複したすべての要素を削除する（最初の要素は残される）。この関数は破壊的に配
 * 列を変更する。重複がない場合にもオーダーは変わらない。
 *
 * オブジェクトの一致判定には {@link goog.getUid} による値が用いられる。
 *
 * 実行時間のオーダー： N,
 * 実行に要する容量： 2N （ほんとだよ！）
 *
 * @param {goog.array.ArrayLike} arr 重複を削除したい配列。
 * @param {Array=} opt_rv 結果を格納するための配列。これが指定されている場合、
 *     arr は変更されず、 opt_rv に結果が上書きされる。
 */
goog.array.removeDuplicates = function(arr, opt_rv) {
  var returnArray = opt_rv || arr;

  var seen = {}, cursorInsert = 0, cursorRead = 0;
  while (cursorRead < arr.length) {
    var current = arr[cursorRead++];

    // key の衝突（true と 'true'）を防ぐためにオブジェクトの種類の頭文字をオブ
    // ジェクトの種類をあらわす値として用いる。
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
 * 与えられた配列の中から検索対象のインデックスを 2 分探索によって探す。
 * opt_compareFn が与えられていない場合、要素は
 * 組み込みの < と > 演算子によって評価する {@link goog.array.defaultCompare}
 * によって比較される。これは、文字列または数値のみを正しく比較できる。
 * 配列は昇順（比較関数による）で配列されていなければならない。もし配列がソート
 * されていない場合は結果は undefined になる。もし配列のなかに複数のターゲットが
 * ある場合、そのいずれかが見つかる。
 *
 * 実行時間のオーダー： O(log n)
 *
 * @param {goog.array.ArrayLike} arr 検索される配列。
 * @param {*} target 検索対象の値。
 * @param {Function=} opt_compareFn 配列の順を定めている比較関数。省略可能。
 *     2 つの引数が与えられ、戻り値が負の場合・0 の場合・正の場合について、それ
 *     ぞれ第一引数が第二引数より小さい・等しい・大きい場合と対応する。
 * @return {number} 検索対象が見つかった場合は最も小さいインデックス。それ以外の
 *     場合は、(-(比較地点) - 1) 。 比較地点は、与えられた配列中に検索対象が存在
 *     した場合のインデックスと一致する。検索対象が見つかった場合は正の値が返
 *     る。
 */
goog.array.binarySearch = function(arr, target, opt_compareFn) {
  return goog.array.binarySearch_(arr,
      opt_compareFn || goog.array.defaultCompare, false /* isEvaluator */,
      target);
};


/**
 * 与えられた配列の各要素を 2 分探索のようにして評価していく。
 * 評価関数は選択したい要素のインデックスが今のインデックスより小さい・ここ・
 * 大きいのどれなのかを指定する。評価関数は一貫性している必要がある（形式的にい
 * えば {@code goog.array.map(goog.array.map(arr, evaluator, opt_obj),
 *  goog.math.sign)} が単調非増加でなければならない）。
 *
 * 実行時間のオーダー: O(log n)
 *
 * @param {goog.array.ArrayLike} arr 検索したい配列。
 * @param {Function} evaluator 評価関数は今の要素・インデックス・検索対象の配列
 *     の 3 つの引数をとる。前方・現在の位置・後方のインデックスを探したい場合に
 *     戻り値はそれぞれ負・ 0 ・正の値をとるべきである。
 * @param {Object=} opt_obj 評価関数の実行時に 'this' に設定されるオブジェクト。
 * @return {number} 比較関数によって一致した最も左の要素のインデックス。それ以外
 *     の場合は、(-(比較地点) - 1) 。 もし要素が見つからなかった場合、比較地点は
 *     負の値か arr.length となる。検索対象が見つかった場合は正の値が返る。
 */
goog.array.binarySelect = function(arr, evaluator, opt_obj) {
  return goog.array.binarySearch_(arr, evaluator, true /* isEvaluator */,
      undefined /* opt_target */, opt_obj);
};


/**
 * 2 分探索の比較関数と評価関数の実行手順を司る実装。引数が評価関数の場合は
 * {@link goog.array.binarySelect} のようにして評価関数のコンテキストを
 * 指定できる。引数が比較関数の場合には評価関数のコンテキストは指定できない。
 *
 * この実装はパフォーマンスにまつわる理由で {@link goog.bind} や
 * {@link goog.partial} を用いていない。
 *
 * 実行時間のオーダー： O(log n)
 *
 * @param {goog.array.ArrayLike} arr 検索したい配列。
 * @param {Function} compareFn  評価関数と比較関数のどちらか。
 * @param {boolean} isEvaluator compareFn が評価関数か否か。
 * @param {*=} opt_target compareFn が比較関数の場合は検索対象のオブジェクト。
 * @param {Object=} opt_selfObj compareFn が評価関数の場合のコンテキストオブジェ
 *     クト。
 * @return {number} 検索対象が見つかった場合は最も小さいインデックス。それ以外の
 *     場合は、(-(比較地点) - 1) 。 比較地点は、与えられた配列中に検索対象が存在
 *     した場合のインデックスと一致する。検索対象が見つかった場合は正の値が返
 *     る。
 * @private
 */
goog.array.binarySearch_ = function(arr, compareFn, isEvaluator, opt_target,
    opt_selfObj) {
  var left = 0;  // は範囲に含まれる
  var right = arr.length;  // は範囲に含まれない
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
      // 最も小さいインデックスを返したいので直ちに値は返さない。
      found = !compareResult;
    }
  }
  // left は見つかった場合のインデックス。見つからなかった場合は比較地点。
  // ~left は -left - 1 の省略形（~ はビット反転演算子）。
  return found ? left : ~left;
};


/**
 * 与えられた配列を昇順でソートする。 opt_compare_Fn が省略された場合は組み込み
 * の < と > で評価する {@code goog.array.defaultCompare} が用いられる。この評価
 * 関数は文字列か数値によって構成される配列を正しく評価できる。このメソッドでは
 * 評価関数によって値が一致したと判定された要素の並び順は保証されない。
 *
 * このソートは安定であることを保証されない。
 *
 * 実行時間： {@code Array.prototype.sort} と同じ
 *
 * @param {Array} arr ソートしたい配列。
 * @param {Function=} opt_compareFn 配列の順を定めている比較関数。省略可能。
 *     2 つの引数が与えられ、戻り値が負の場合・0 の場合・正の場合について、それ
 *     ぞれ第一引数より第二引数が小なり・等しい・大なりの場合と対応する。
 */
goog.array.sort = function(arr, opt_compareFn) {
  // TODO(arv): null が許可されなくなってからの評価に改めるべき。
  goog.asserts.assert(arr.length != null);

  goog.array.ARRAY_PROTOTYPE_.sort.call(
      arr, opt_compareFn || goog.array.defaultCompare);
};


/**
 * 与えられた配列を安定的な方法でソートする。 opt_compare_Fn が省略された場合は
 * 組み込みの < と > で評価する {@code goog.array.defaultCompare} が用いられる。
 * この評価関数は文字列か数値によって構成される配列を正しく評価できる。
 *
 * このソートでは値が等しいと判定された場合、インデックスの大小で評価される。
 *
 * 実行時間： {@code Array.prototype.sort} と同じだが、 O(n) のオーダーで配列を
 * 2 回コピーする分のオーバーヘッドが加わる。
 *
 * @param {Array} arr ソートしたい配列。
 * @param {Function=} opt_compareFn 配列の順を定めている比較関数。省略可能。
 *     2 つの引数が与えられ、戻り値が負の場合・0 の場合・正の場合について、それ
 *     ぞれ第一引数が第二引数より小さい・等しい・大きい場合と対応する。
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
 * オブジェクトからなる配列を指定されたキーの要素でソートする。 opt_compare_Fn
 * が省略された場合は組み込みの < と > で評価する
 * {@code goog.array.defaultCompare} が用いられる。
 * このメソッドはコンパイラによってリネームされた場合に正しく動作しない。
 * なので {foo: 1, bar: 2} ではなく {'foo': 1, 'bar': 2} と書かなければならな
 * い。
 *
 * @param {Array.<Object>} arr ソートしたいオブジェクトからなる配列。
 * @param {string} key ソートの際に用いるキー。
 * @param {Function=} opt_compareFn 値を比較する関数。
 */
goog.array.sortObjectsByKey = function(arr, key, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  goog.array.sort(arr, function(a, b) {
    return compare(a[key], b[key]);
  });
};


/**
 * 配列がソート済みかどうかを判定する。
 * @param {!Array} arr 配列。
 * @param {Function=} opt_compareFn 配列の順を定めている比較関数。省略可能。
 *     2 つの引数が与えられ、戻り値が負の場合・0 の場合・正の場合について、それ
 *     ぞれ第一引数が第二引数より小さい・等しい・大きい場合と対応する。
 * @param {boolean=} opt_strict true にすると値が等しい場合も false を返す。
 * @return {boolean} 配列がソート済みかどうか。
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
 * 2 つの配列が等しいかどうかを判定する。2 つの配列の要素数が同じで含まれている
 * 要素が比較関数によってすべて等しいかどうかを判定される。
 *
 * @param {goog.array.ArrayLike} arr1 判定する配列。
 * @param {goog.array.ArrayLike} arr2 判定する配列。
 * @param {Function=} opt_equalsFn 省略可能な比較関数。2 つの引数が一致すれば
 *     true 、一致しなければ false を返す。省略時は組み込みの '===' 演算子を用い
 *     る {@link goog.array.defaultCompareEquality} が使われる。
 * @return {boolean} 2 つの配列が等しいかどうか。
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
 * @deprecated {@link goog.array.equals} を使うべき。
 * @param {goog.array.ArrayLike} arr1 {@link goog.array.equals} を参照。
 * @param {goog.array.ArrayLike} arr2 {@link goog.array.equals} を参照。
 * @param {Function=} opt_equalsFn {@link goog.array.equals} を参照。
 * @return {boolean} {@link goog.array.equals} を参照。
 */
goog.array.compare = function(arr1, arr2, opt_equalsFn) {
  return goog.array.equals(arr1, arr2, opt_equalsFn);
};


/**
 * 2 つの配列の大小または一致を判定する。
 * @param {!goog.array.ArrayLike} arr1 判定する配列。
 * @param {!goog.array.ArrayLike} arr2 判定する配列。
 * @param {Function=} opt_compareFn 配列の順を定めている比較関数。省略可能。
 *     2 つの引数が与えられ、戻り値が負の場合・0 の場合・正の場合について、それ
 *     ぞれ第一引数が第二引数より小さい・等しい・大きい場合と対応する。
 * @return {number} 負・ 0 ・正の場合について、それぞれ arr1 が arr2
 *     よりが小さい・等しい・大きい場合と対応する。
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
 * 2 つの値を組み込みの < と > 演算子によって比較する。
 * @param {*} a 比較する要素。
 * @param {*} b 比較する要素。
 * @return {number} 負・ 0 ・正の場合について、それぞれ a が b よりが小さい・等
 *     しい・大きい場合と対応する。
 */
goog.array.defaultCompare = function(a, b) {
  return a > b ? 1 : a < b ? -1 : 0;
};


/**
 * 2 つの値を組み込みの '===' 演算子によって比較する。
 * @param {*} a 比較する要素。
 * @param {*} b 比較する要素。
 * @return {boolean} 一致すれば true 一致しなければ false 。
 */
goog.array.defaultCompareEquality = function(a, b) {
  return a === b;
};


/**
 * ソートされた配列の中に値を挿入する。値が既に存在している場合、配列は変更され
 * ない。
 * @param {Array} array 変更される配列。
 * @param {*} value 挿入されるオブジェクト。
 * @param {Function=} opt_compareFn 配列の順を定めている比較関数。省略可能。
 *     2 つの引数が与えられ、戻り値が負の場合・0 の場合・正の場合について、それ
 *     ぞれ第一引数が第二引数より小さい・等しい・大きい場合と対応する。
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
 * ソートされた配列から与えられた値と一致する値を削除する。
 * @param {Array} array 変更される配列。
 * @param {*} value 削除されるオブジェクト。
 * @param {Function=} opt_compareFn 配列の順を定めている比較関数。省略可能。
 *     2 つの引数が与えられ、戻り値が負の場合・0 の場合・正の場合について、それ
 *     ぞれ第一引数が第二引数より小さい・等しい・大きい場合と対応する。
 * @return {boolean} 値が削除されれば true 。
 */
goog.array.binaryRemove = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  return (index >= 0) ? goog.array.removeAt(array, index) : false;
};


/**
 * 与えられた配列の各要素を判別関数によってオブジェクトのなかの配列ごとに分別し
 * て格納する。
 * @param {Array} array 配列。
 * @param {Function} sorter 各要素について実行される関数。 この関数は、現在の要
 *     素・インデックス・与えられた配列の 3 つの引数をとる。戻り値はオブジェクト
 *     のキーにできるもの（文字列、数値など）で互いに異なっている必要がある。
 *     戻り値が undefined の場合、その要素は追加されない。
 * @return {!Object} sorter によって生成されたユニークなキーにマッピングされた配
 *     列要からなるオブジェクト。
 */
goog.array.bucket = function(array, sorter) {
  var buckets = {};

  for (var i = 0; i < array.length; i++) {
    var value = array[i];
    var key = sorter(value, i, array);
    if (goog.isDef(key)) {
      // 配列が未定義の場合は空配列を代入する。
      var bucket = buckets[key] || (buckets[key] = []);
      bucket.push(value);
    }
  }

  return buckets;
};


/**
 * 値が N 回繰り返された配列を返す。
 *
 * @param {*} value 繰り返すオブジェクト。
 * @param {number} n 繰り返す回数。
 * @return {!Array} 繰り返されたオブジェクトからなる配列。
 */
goog.array.repeat = function(value, n) {
  var array = [];
  for (var i = 0; i < n; i++) {
    array[i] = value;
  }
  return array;
};


/**
 * 与えられた要素を平たい配列に変換する。要素が配列の場合は再帰的に処理される。
 *
 * @param {...*} var_args 平たい配列に変換したいオブジェクト。
 * @return {!Array.<*>} 与えられたオブジェクトからなる平たい配列。
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
 * 配列を破壊的にローテート（要素をずらす）する。このメソッドが実行された後の
 * i 番目の要素は前の (i - n) % array.length 番目の要素になる。すべての i は 0
 * から array.length - 1 の範囲に収まる。
 *
 * 例えば、 [t, a, n, k, s] が与えられ、 rotate(array, 1) （または
 * rotate(array, -4) ）が実行されると配列は [s, t, a, n, k] のようになる。
 *
 * @param {!Array.<*>} array ローテートしたい配列。
 * @param {number} n ローテ—トする回数。
 * @return {!Array.<*>} 配列。
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
 *
 * 与えられた配列の同じ位置の要素を要素とした配列を配列にまとめて返す。
 * 返される配列はもっとも小さい配列の要素数にあわせられ、余った要素は無視され
 * る。例えば、 [1, 2] と [3, 4, 5] が与えられた場合、結果は [[1,3], [2, 4]] と
 * なる。
 *
 * これは Python の zip() と同じような働きをする。 {@link
 * http://docs.python.org/library/functions.html#zip} を参照。
 *
 * @param {...!goog.array.ArrayLike} var_args 要素を取り出す配列。
 * @return {!Array.<!Array>} 与えられた要素がインデックス毎にまとめられた新しい
 *      配列。
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
      // もし、 i が arr.length よりも大きければこれが最も小さい配列。
      if (i >= arr.length) {
        return result;
      }
      value.push(arr[i]);
    }
    result.push(value);
  }
};


/**
 * 与えられた配列の要素を Fisher-Yates のアルゴリズム（ Knush のシャッフルとして
 * 知られている ）によって破壊的にシャッフルする。標準では Math.random() が利用
 * されるが、乱数生成関数を指定することもできる。
 *
 * 実行時間のオーダー： O(n)
 *
 * @param {!Array} arr シャッフルしたい配列。
 * @param {Function=} opt_randFn シャッフルで利用する乱数生成関数。省略可能。
 *     引数はとらず、 0 〜 1 までの値を返す関数でなければならない。
 *     省略時は組み込みの Math.random() が用いられる。
 */
goog.array.shuffle = function(arr, opt_randFn) {
  var randFn = opt_randFn || Math.random;

  for (var i = arr.length - 1; i > 0; i--) {
    // 0 〜 i のインデックスを選択する。
    var j = Math.floor(randFn() * (i + 1));

    var tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
};
