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
 * @fileoverview Closure Library のブートストラップ。
 *
 * In uncompiled mode base.js will write out Closure's deps file, unless the
 * global <code>CLOSURE_NO_DEPS</code> is set to true.  This allows projects to
 * include their own deps file(s) from different locations.
 *
 */


/**
 * @define {boolean} --closure_pass か --mark_as_compiled が指定された場合に、
 *     Compiler によって true に上書きされる。
 */
var COMPILED = false;


/**
 * Closure Library のトップレベル名前空間。現在のスコープで既に goog が定義され
 * ている場合には、繰り返し定義されてしまうことを防ぐ。
 *
 * @const
 */
var goog = goog || {}; // Closure Library の基となる識別子。


/**
 * グローバルコンテキストへの参照。たいていの場合は 'window'。
 */
goog.global = this;


/**
 * @define {boolean} DEBUG は--define goog.DEBUG=false を指定することによってデ
 * バッグコードが製品版に含まれることを簡単に防ぐことができる。例えば、多くの
 * toString() メソッドは (1) デバッグを目的として使われる、(2) JSコンパイラに
 * とって toString() が使われているかどうかを判定することが難しい、という 2 つの
 * 理由から "if (goog.DEBUG)" というように宣言されている。
 */
goog.DEBUG = true;


/**
 * @define {string} LOCALE はコンパイルする際の言語を定義する。地域特有のデータ
 * を用いる場合に選択するとよい。
 * JS コンパイラの実行時に "--define goog.LOCALE=<locale_name>" というように指定
 * する。
 *
 * アカウントの中では地域特有のコードは重要である。ハイフンを区切り文字とした標
 * 準的な Unicode で指定する必要がある。言語（小文字） - 国・地域（大文字）のよ
 * うに指定する。
 * 例：ja-JP、en、en-US、sr-Latin-BO、zh-Hans-CN
 *
 * 地域・言語情報の詳細は以下を参照。{@link 
 * http://www.unicode.org/reports/tr35/#Unicode_Language_and_Locale_Identifiers}
 *
 * 日本語情報：
 * {@link http://ja.wikipedia.org/wiki/ISO_639}
 * {@link http://ja.wikipedia.org/wiki/ISO_3166-1_alpha-2}
 *
 * 言語コードは ISO 639-1によって定義されている値を指定する。{@link 
 * http://www.w3.org/WAI/ER/IG/ert/iso639.htm} を参照。
 * 注記： ヘブライ言語については新コード(he)ではなく旧コード(iw)を使うほうがよ
 * い。{@link see http://wiki/Main/IIISynonyms} を参照（デッドリンク）。
 *
 */
goog.LOCALE = 'en';  // default to en


/**
 * オブジェクトスタブ（空の名前空間）を作成する。 goog.provide() はそのファイル
 * の提供する名前空間/オブジェクトを定義する。ビルドツールはこの provide/require 
 * 文から依存関係を把握し、依存関係の記述ファイル dep.js を生成する。
 *
 * @see goog.require
 * @param {string} name このファイルが提供する名前空間を "goog.package.part" の
 *     ようにして指定する。
 */
goog.provide = function(name) {
  if (!COMPILED) {
    // 名前空間が 2 度定義されないようにする。これは変数宣言に影響を与えることを
    // 新しい開発者に悟らせる意図がある。JS コンパイラが goog.provide を実際の変
    // 数宣言へと変換されたとき、コンパイルされた JS は元の JS と同じように動作
    // しなければならない。したがって、間違った goog.provide の使い方を含むコー
    // ドのコンパイルの結果が動作しないのと同様に、コンパイル前の JS も動作して
    // はならない。
    if (goog.isProvided_(name)) {
      throw Error('Namespace "' + name + '" already declared.');
    }
    delete goog.implicitNamespaces_[name];

    var namespace = name;
    while ((namespace = namespace.substring(0, namespace.lastIndexOf('.')))) {
      if (goog.getObjectByName(namespace)) {
        break;
      }
      goog.implicitNamespaces_[namespace] = true;
    }
  }

  goog.exportPath_(name);
};


/**
 * このファイルがテスト目的のファイルで製品コードに含まれないようにマークする。
 * @param {string=} opt_message 除去されないまま製品コードに含まれてしまった場合
 *      のエラーメッセージに追記される文字列。省略可能。
 */
goog.setTestOnly = function(opt_message) {
  if (COMPILED && !goog.DEBUG) {
    opt_message = opt_message || '';
    throw Error('Importing test-only code into non-debug environment' +
                opt_message ? ': ' + opt_message : '.');
  }
};


if (!COMPILED) {

  /**
   * 与えられた名前パスで既に {@link goog.provide} されているかどうかを判定す
   * る。これは、 {@link goog.implicitNamespaces_} に与えられた名前が存在する場
   * 合に false が返される。
   * @param {string} name 判定したい名前パス。
   * @return {boolean} 与えられた名前パスで既に定義されていれば true 。
   * @private
   */
  goog.isProvided_ = function(name) {
    return !goog.implicitNamespaces_[name] && !!goog.getObjectByName(name);
  };

  /**
   * 名前空間は暗黙的に {@link goog.provide} によって定義される。例えば、
   * goog.provide('goog.events.Event') が実行された場合には暗黙的に 'goog' と
   * 'goog.events' が名前空間として宣言されている。
   *
   * @type {Object}
   * @private
   */
  goog.implicitNamespaces_ = {};
}


/**
 * 名前空間パスからオブジェクト階層を構築する。名前が既に定義されていた場合は上
 * 書きしない。
 * 例：
 * "a.b.c" -> a = {};a.b={};a.b.c={};
 * {@link goog.provide} {@link goog.exportSymbol} で使う。 
 * @param {string} name 対象となっているオブジェクトの属する名前空間の名前パス。
 * @param {*=} opt_object 名前パスの末尾で定義されているオブジェクト。省略可能。
 * @param {Object=} opt_objectToExportTo The object to add the path to; default
 *     is |goog.global|.
 * @param {Object=} opt_objectToExportTo オブジェクトを追加する際のスコープ。省
 *     略時は {@link goog.global} 。
 * @private
 */
goog.exportPath_ = function(name, opt_object, opt_objectToExportTo) {
  var parts = name.split('.');
  var cur = opt_objectToExportTo || goog.global;

  // Internet Explorer ではこのやり方で外部出力してエラーが投げられた場合は異
  // なる挙動を示す。 base_test.html 中の testExportSymbolExceptions の例を参
  // 照。
  if (!(parts[0] in cur) && cur.execScript) {
    cur.execScript('var ' + parts[0]);
  }

  // いくつかのブラウザは {@code for((a in b); c;);} の形式のコードを解釈できな
  // い。このパターンは JS コンパイラによって下の文が書き換えられたときに生じ
  // る。これを防止するために for 文 を使い、下のような初期化ロジックを用意す
  // る。

  // Firefox での strict モードにおける警告を避けるために括弧を用いる。
  for (var part; parts.length && (part = parts.shift());) {
    if (!parts.length && goog.isDef(opt_object)) {
      // part が最後の要素で opt_object が与えられていればそれを用いる。
      cur[part] = opt_object;
    } else if (cur[part]) {
      cur = cur[part];
    } else {
      cur = cur[part] = {};
    }
  }
};


/**
 * 外部にある完全な名前パスをもつオブジェクトを返す。コンパイルされた場合にはプ
 * ロパティがリネームされるため、プロパティ名には注意すること。
 *
 * @param {string} name The 完全な名前パス。
 * @param {Object=} opt_obj オブジェクトをこの名前空間から探す。省略時は
 *     {@link goog.global} 。
 * @return {?} プリミティブな値かオブジェクト。見つからなかった場合は null 。
 */
goog.getObjectByName = function(name, opt_obj) {
  var parts = name.split('.');
  var cur = opt_obj || goog.global;
  for (var part; part = parts.shift(); ) {
    if (goog.isDefAndNotNull(cur[part])) {
      cur = cur[part];
    } else {
      return null;
    }
  }
  return cur;
};


/**
 * Globalizes a whole namespace, such as goog or goog.lang.
 * 与えられた名前空間のすべてのメンバをグローバルに追加する。
 *
 * @param {Object} obj グローバルに追加するメンバを含む名前空間。
 * @param {Object=} opt_global メンバが追加される名前空間。省略可能。
 * @deprecated プロパティをグローバルスコープに追加することはできるものの、大き
 *     い名前空間のなかで実行されるべきでない。
 */
goog.globalize = function(obj, opt_global) {
  var global = opt_global || goog.global;
  for (var x in obj) {
    global[x] = obj[x];
  }
};


/**
 * このファイルに必要なファイルを依存関係に追加する。
 * @param {string} relPath この JavaScript のパス。
 * @param {Array} provides このファイルが定義するオブジェクトの名前からなる配
 *     列。
 * @param {Array} requires このファイルに必要なオブジェクトの名前からなる配列。
 */
goog.addDependency = function(relPath, provides, requires) {
  if (!COMPILED) {
    var provide, require;
    var path = relPath.replace(/\\/g, '/');
    var deps = goog.dependencies_;
    for (var i = 0; provide = provides[i]; i++) {
      deps.nameToPath[provide] = path;
      if (!(path in deps.pathToNames)) {
        deps.pathToNames[path] = {};
      }
      deps.pathToNames[path][provide] = true;
    }
    for (var j = 0; require = requires[j]; j++) {
      if (!(path in deps.requires)) {
        deps.requires[path] = {};
      }
      deps.requires[path][require] = true;
    }
  }
};




// NOTE(nnaze): The debug DOM loader was included in base.js as an orignal
// way to do "debug-mode" development.  The dependency system can sometimes
// be confusing, as can the debug DOM loader's asyncronous nature.
//
// With the DOM loader, a call to goog.require() is not blocking -- the
// script will not load until some point after the current script.  If a
// namespace is needed at runtime, it needs to be defined in a previous
// script, or loaded via require() with its registered dependencies.
// User-defined namespaces may need their own deps file.  See http://go/js_deps,
// http://go/genjsdeps, or, externally, DepsWriter.
// http://code.google.com/closure/library/docs/depswriter.html
//
// Because of legacy clients, the DOM loader can't be easily removed from
// base.js.  Work is being done to make it disableable or replaceable for
// different environments (DOM-less JavaScript interpreters like Rhino or V8,
// for example). See bootstrap/ for more information.


/**
 * @define {boolean} true ならデバッグローダーを有効にする。
 *
 * これが有効にされていて、名前空間が既に登録されていれば {@link goog.provide} 
 * はスクリプトタグを DOM に追加することで名前空間を読み込む。
 *
 * もし無効にすると {@link goog.provide} は名前空間を既に読込済みの状態にする。
 * つまり、他の仕組みによってスクリプトを読み込まなければならない。
 */
goog.ENABLE_DEBUG_LOADER = true;


/**
 * 動的に依存関係を解決する関数。これはビルダー上でも動作する。--closire_pass オ
 * プションが設定されている場合、JS コンパイラはこの関数を読み込むオブジェクトに
 * 書き換える。
 * @see goog.provide
 * @param {string} name 読み込みたい名前空間を "goog.package.part" のように記述
 *     した名前パス。名前空間は {@link goog.provide} によって定義されている必要
 *     がある。
 */
goog.require = function(name) {

  // if the object already exists we do not need do do anything
  // TODO(arv): If we start to support require based on file name this has
  //            to change
  // TODO(arv): If we allow goog.foo.* this has to change
  // TODO(arv): If we implement dynamic load after page load we should probably
  //            not remove this code for the compiled output
  if (!COMPILED) {
    if (goog.isProvided_(name)) {
      return;
    }

    if (goog.ENABLE_DEBUG_LOADER) {
      var path = goog.getPathFromDeps_(name);
      if (path) {
        goog.included_[path] = true;
        goog.writeScripts_();
        return;
      }
    }

    var errorMessage = 'goog.require could not find: ' + name;
    if (goog.global.console) {
      goog.global.console['error'](errorMessage);
    }


      throw Error(errorMessage);

  }
};


/**
 * ライブラリの読込の基準となる URI 。ふつうは base.js のあるディレクトリに自動
 * 的にセットされる。
 * @type {string}
 */
goog.basePath = '';


/**
 * コンパイラによる書き換えられる基準パス。 {@link goog.basePath} に置き換わる。
 * @type {string|undefined}
 */
goog.global.CLOSURE_BASE_PATH;


/**
 * true ならば Closure 用の依存関係用ファイルを読み込む。 falsely ならば 
 * {@link goog.basePath} 直下の deps.js が読み込まれる。
 * @type {boolean|undefined}
 */
goog.global.CLOSURE_NO_DEPS;


/**
 * スクリプトを読み込むための関数。これは、 web workers のような Closure が HTML
 * ではない環境で動作することを想定して用意されている。この関数はグローバルスコ
 * ープで定義できるため、 base.js よりも前に読み込むことができる。この関数によっ
 * て非 HTML 環境でも deps.js による適切なインポートができる。
 *
 * この関数は相対 URI によってスクリプトを通さなければならない。この関数は、スク
 * リプトが無事インポートできたら true を返し、それ以外の場合には false を返すこ
 * とが望ましい。
 *
 * @note orga.chem.job@gmail.com (OrgaChem)
 * この変数を書き換えてサーバーサイド JavaScript エンジンの node.js 上で Closure
 * Library が動作できるようにしているプロジェクトがあり、この関数のはたらきがよ
 * く理解できる。
 * <dl>
 * <dt>node-closure</dt>
 * <dd>{@link https://github.com/lm1/node-closure/blob/master/closure.js}</dd>
 * <dt>node.js</dt>
 * <dd>{@link http://nodejs.org/}</dd>
 * </dl>
 */
goog.global.CLOSURE_IMPORT_SCRIPT;


/**
 * null 関数はコールバックの初期値などで使われる。
 * @return {void} Nothing.
 */
goog.nullFunction = function() {};


/**
 * 恒等関数。最初の引数を返す。
 *
 * @param {*=} opt_returnValue 返される唯一の値。
 * @param {...*} var_args 無視される追加の引数。戻り値に影響しない。
 * @return {?} 最初の引数。実際に実行されるまでは戻り値が何かを特定することがで
 *      きない。
 * @deprecated {@link goog.functions.identity} を使うべき。
 */
goog.identityFunction = function(opt_returnValue, var_args) {
  return opt_returnValue;
};


/**
 * 抽象クラスやインターフェースのメソッドの初期値として使う関数。
 * サブクラスがこのメソッドのオーバーライドを忘れる・失敗するとエラーが投げられ
 * る。
 *
 * 抽象クラス Foo のメソッド bar() を定義することを考える。
 * 
 * <pre>Foo.prototype.bar = goog.abstractMethod;</pre>
 *
 * @note
 * 引数なども含めてオーバーライドされることを考え、より抽象化するために関数名は
 * 設定されていない。
 *
 * @type {!Function}
 * @throws {Error} この関数をオーバーライドするべきであったことを警告する。
 */
goog.abstractMethod = function() {
  throw Error('unimplemented abstract method');
};


/**
 * Adds a {@code getInstance} static method that always return the same instance
 * object.
 * 常に同じインスタンスを返す静的メソッド（クラスメソッド） {@code getInstance}
 * を定義する。
 *
 * @note orga.chem.job@gmail.com (OrgaChem)
 * この関数はシングルトンパターン（インスタンスが唯一であることが保証されるパタ
 * ーン）のクラス生成のときに用いられる。
 * 例えば、シングルトンクラス {@link foo.Singleton} のコードは以下のようになる。
 * <pre>
 *   foo.Singleton = function() {
 *     // コンストラクタの処理
 *   };
 *   goog.addSingletonGetter(foo.Singleton);
 *
 *   var a = foo.Singleton.getInstance();
 *   var b = foo.Singleton.getInstance();
 *   a === b; // -> true
 * </pre>
 *
 * @param {!Function} ctor 唯一のインスタンスを返すメソッドを加えたい静的オブ
 *     ジェクト。
 */
goog.addSingletonGetter = function(ctor) {
  ctor.getInstance = function() {
    if (ctor.instance_) {
      return ctor.instance_;
    }
    if (goog.DEBUG) {
      // NOTE: JS コンパイラは {@link Array#push} を最適化できない。
      goog.instantiatedSingletons_[goog.instantiatedSingletons_.length] = ctor;
    }
    return ctor.instance_ = new ctor;
  };
};


/**
 * テストのためにインスタンス化されたすべてのシングルトンクラスが格納される。
 * ただし、これを直接読み込んではならない。 {@link goog.testing.singleton} モ
 * ジュールを使うべきである。これによって、コンパイラは変数が使われていない場合
 * に除去することができるようになる。
 *
 * @type {!Array.<!Function>}
 * @private
 */
goog.instantiatedSingletons_ = [];


if (!COMPILED && goog.ENABLE_DEBUG_LOADER) {
  /**
   * URL が既に追加されているかどうかを記録するためのオブジェクト。このレコード
   * は循環依存を防ぐために使われる。
   * @type {Object}
   * @private
   */
  goog.included_ = {};


  /**
   * 依存関係と読み込むスクリプトのデータを記録するためのオブジェクト。
   * @private
   * @type {Object}
   */
  goog.dependencies_ = {
    pathToNames: {}, // 1 以上
    nameToPath: {}, // 1 対 1
    requires: {}, // 1 以上
    // 依存しているファイルが複数回読み込まれることを防ぐ。
    visited: {},
    written: {} // 既にスクリプトに書き込み済みかどうかを記録しておく
  };


  /**
   * HTML 環境かどうかを判定する。
   * @return {boolean} HTML 環境であれば true 。
   * @private
   */
  goog.inHtmlDocument_ = function() {
    var doc = goog.global.document;
    return typeof doc != 'undefined' &&
           'write' in doc;  // XUL 環境の場合は write メンバが定義されていない
  };


  /**
   * 起動時に base.js ファイルがあるファイルパスを得るための関数。
   * @private
   */
  goog.findBasePath_ = function() {
    if (goog.global.CLOSURE_BASE_PATH) {
      goog.basePath = goog.global.CLOSURE_BASE_PATH;
      return;
    } else if (!goog.inHtmlDocument_()) {
      return;
    }
    var doc = goog.global.document;
    var scripts = doc.getElementsByTagName('script');
    // 今のスクリプトに base.js が読み込まれているかどうかを遡って調べる。
    for (var i = scripts.length - 1; i >= 0; --i) {
      var src = scripts[i].src;
      var qmark = src.lastIndexOf('?');
      var l = qmark == -1 ? src.length : qmark;
      if (src.substr(l - 7, 7) == 'base.js') {
        goog.basePath = src.substr(0, l - 7);
        return;
      }
    }
  };


  /**
   * スクリプトをインポートする。インポートは既にインポートされている場合にはお
   * こなわれない。
   * 実行する際に必ず呼び出されなければならない。
   * @param {string} src スクリプトのファイルパス。
   * @private
   */
  goog.importScript_ = function(src) {
    var importScript = goog.global.CLOSURE_IMPORT_SCRIPT ||
        goog.writeScriptTag_;
    if (!goog.dependencies_.written[src] && importScript(src)) {
      goog.dependencies_.written[src] = true;
    }
  };


  /**
   * 関数をインポートするための標準的関数。インポートはスクリプトタグを書き込む
   * 方法でおこなわれる。
   *
   * @param {string} src インポートするファイルのパス。
   * @return {boolean} インポートに成功すれば true 。失敗すれば false 。
   * @private
   */
  goog.writeScriptTag_ = function(src) {
    if (goog.inHtmlDocument_()) {
      var doc = goog.global.document;
      doc.write(
          '<script type="text/javascript" src="' + src + '"></' + 'script>');
      return true;
    } else {
      return false;
    }
  };


  /**
   * {@link goog.addDependency} によって追加された依存関係を解決する。
   * スクリプトは {@link goog.importScript_} によって正しい順番で呼び出される。
   * @private
   */
  goog.writeScripts_ = function() {
    // the scripts we need to write this time
    var scripts = [];
    var seenScript = {};
    var deps = goog.dependencies_;

    function visitNode(path) {
      if (path in deps.written) {
        return;
      }

      // この場合はすでに読み込まれている。循環依存がある場合は true になる。
      if (path in deps.visited) {
        if (!(path in seenScript)) {
          seenScript[path] = true;
          scripts.push(path);
        }
        return;
      }

      deps.visited[path] = true;

      if (path in deps.requires) {
        for (var requireName in deps.requires[path]) {
          // 与えられた名前が既に定義されていれば、別な手段によって読み込まれた
          // と見なす。
          if (!goog.isProvided_(requireName)) {
            if (requireName in deps.nameToPath) {
              visitNode(deps.nameToPath[requireName]);
            } else {
              throw Error('Undefined nameToPath for ' + requireName);
            }
          }
        }
      }

      if (!(path in seenScript)) {
        seenScript[path] = true;
        scripts.push(path);
      }
    }

    for (var path in goog.included_) {
      if (!deps.written[path]) {
        visitNode(path);
      }
    }

    for (var i = 0; i < scripts.length; i++) {
      if (scripts[i]) {
        goog.importScript_(goog.basePath + scripts[i]);
      } else {
        throw Error('Undefined script input');
      }
    }
  };


  /**
   * Looks at the dependency rules and tries to determine the script file that
   * fulfills a particular rule.
   * @param {string} rule "goog.namespace.Class" または "project.script" の形式
   *     で記述された名前。
   * @return {?string} rule に関係するファイルの URL 。見つからなかった場合は
   *     null。
   * @private
   */
  goog.getPathFromDeps_ = function(rule) {
    if (rule in goog.dependencies_.nameToPath) {
      return goog.dependencies_.nameToPath[rule];
    } else {
      return null;
    }
  };

  goog.findBasePath_();

  // 依存関係を Closure が管理できるようならば実行する。
  if (!goog.global.CLOSURE_NO_DEPS) {
    goog.importScript_(goog.basePath + 'deps.js');
  }
}



//==============================================================================
// 言語の拡張
//==============================================================================


/**
 * これは typeof 演算子(改)である。この typeof 演算子は null が与えられた場合は
 * 'null' を返し、配列が与えられた場合は 'array' を返す。
 * @param {*} value 型を調べたいオブジェクト。
 * @return {string} 型の名前。
 */
goog.typeOf = function(value) {
  var s = typeof value;
  if (s == 'object') {
    if (value) {
      // まず、可能であれば {@link Object.prototype.toString} が呼ばれることを
      // 避ける。
      //
      // IE では typeof が実行コンテキストによって不適切にまとめられている。
      // しかし、横断コンテキストでは instanceof Object は false を返す。
      if (value instanceof Array) {
        return 'array';
      } else if (value instanceof Object) {
        return s;
      }

      // HACK: Object の prototype メソッドは任意の値で使うことができる。コンパ
      // イラでは Object が投げられなければならないが、 ECMA の仕様によればこの
      // 方法でもよい。
      var className = Object.prototype.toString.call(
          /** @type {Object} */ (value));
      // Firefoc 3.6 では iframe window オブジェクトの length プロパティにアクセ
      // スすると NS_ERROR_FAILURE というエラーが発生する。なので、これは特別な
      // ケースである。
      if (className == '[object Window]') {
        return 'object';
      }

      // <code>constructor == Array</code> または <code>instance of Array</code>
      // という方法は違うフレームの配列オブジェクトに使うことができない。 IE6 で
      // は、iframe のなかで配列が作られるとその配列は破壊されるうえに、
      // <code>prototype</code> オブジェクトが失われてしまう。このとき、
      // <code>val.splice</code> の参照が切れるので <code>goog.isFunction</code>
      // を使うとエラーが発生する。この場合、元の typeof 演算子を直接呼び出せば
      // 'unknown' が返されるために判定できる。この状況の配列は、配列みたいなオ
      // ブジェクトとして振る舞うので多くの配列関数は動作でき、slice は false を
      // 返す。
      // mark Miller 氏によればこの方法は偽造不能な Class プロパティにアクセスで
      // きる。
      //  15.2.4.2 Object.prototype.toString ( )
      //  toString メソッドが呼出されると、次のステップが取られる:
      //      1. このオブジェクトの [[Class]] プロパティを取得。
      //      2. 3 つの文字列 "[object ", Result(1), "]" を連結した文字列を算出
      //         する。
      //      3. Result(2) を返す。
      // この振る舞いは先の実行コンテキストによる破壊に耐えることができる。
      if ((className == '[object Array]' ||
           // In IE all non value types are wrapped as objects across window
           // boundaries (not iframe though) so we have to do object detection
           // for this edge case
           typeof value.length == 'number' &&
           typeof value.splice != 'undefined' &&
           typeof value.propertyIsEnumerable != 'undefined' &&
           !value.propertyIsEnumerable('splice')

          )) {
        return 'array';
      }
      // HACK: There is still an array case that fails.
      //     function ArrayImpostor() {}
      //     ArrayImpostor.prototype = [];
      //     var impostor = new ArrayImpostor;
      // this can be fixed by getting rid of the fast path
      // (value instanceof Array) and solely relying on
      // (value && Object.prototype.toString.vall(value) === '[object Array]')
      // but that would require many more function calls and is not warranted
      // unless closure code is receiving objects from untrusted sources.

      // IE in cross-window calls does not correctly marshal the function type
      // (it appears just as an object) so we cannot use just typeof val ==
      // 'function'. However, if the object has a call property, it is a
      // function.
      if ((className == '[object Function]' ||
          typeof value.call != 'undefined' &&
          typeof value.propertyIsEnumerable != 'undefined' &&
          !value.propertyIsEnumerable('call'))) {
        return 'function';
      }


    } else {
      return 'null';
    }

  } else if (s == 'function' && typeof value.call == 'undefined') {
    // In Safari typeof nodeList returns 'function', and on Firefox
    // typeof behaves similarly for HTML{Applet,Embed,Object}Elements
    // and RegExps.  We would like to return object for those and we can
    // detect an invalid function by making sure that the function
    // object has a call method.
    return 'object';
  }
  return s;
};


/**
 * 与えられた値が undefined でなければ true を返す。
 * @warning この関数はオブジェクトのプロパティを確かめるために使ってはならない。
 * この用途では in 演算子をつかうべき。また、この関数はグローバルで定義された
 * undefined 値が書き換えられていない状況を想定している。
 * @param {*} val テストしたい値。
 * @return {boolean} 値が定義されていれば true 。
 */
goog.isDef = function(val) {
  return val !== undefined;
};


/**
 * 与えられた値が null であれば true を返す。
 * @param {*} val テストしたい値。
 * @return {boolean} 値が null であれば true 。
 */
goog.isNull = function(val) {
  return val === null;
};


/**
 * 与えられた値が定義されていて、かつ null でないときに true を返す。
 * @param {*} val テストしたい値。
 * @return {boolean} 値が定義されていて null でなければ true 。
 */
goog.isDefAndNotNull = function(val) {
  // undefined == null -> true 。
  return val != null;
};


/**
 * 与えられた値が配列であれば true を返す。
 * @param {*} val テストしたい値。
 * @return {boolean} 値が配列であれば true 。
 */
goog.isArray = function(val) {
  return goog.typeOf(val) == 'array';
};


/**
 * 与えられた値が配列のようなオブジェクトであれば true を返す。配列のようなオブ
 * ジェクトとは NoodeList や length プロパティが存在して、それが数値であるような
 * オブジェクトのことである。
 * @param {*} val テストしたい値。
 * @return {boolean} 値が配列みたいなオブジェクトであれば true 。
 */
goog.isArrayLike = function(val) {
  var type = goog.typeOf(val);
  return type == 'array' || type == 'object' && typeof val.length == 'number';
};


/**
 * Date みたいなオブジェクトであれば true を返す。Date みたいなオブジェクトとは
 * getFullYear() のようなメソッドをもつオブジェクトのことである。
 * @param {*} val テストしたい値。
 * @return {boolean} 値が Date みたいなオブジェクトであれば true 。
 */
goog.isDateLike = function(val) {
  return goog.isObject(val) && typeof val.getFullYear == 'function';
};


/**
 * 値が文字列であれば true を返す。
 * @param {*} val テストしたい値。
 * @return {boolean} 値が文字列であれば true 。
 */
goog.isString = function(val) {
  return typeof val == 'string';
};


/**
 * 値が真偽値であれば true を返す。
 * @param {*} val テストしたい値。
 * @return {boolean} 値が真偽値であれば true 。
 */
goog.isBoolean = function(val) {
  return typeof val == 'boolean';
};


/**
 * 値が数値であれば true を返す。
 * @param {*} val テストしたい値。
 * @return {boolean} 値が数値であれば true 。
 */
goog.isNumber = function(val) {
  return typeof val == 'number';
};


/**
 * 値が関数であれば true を返す。
 * @param {*} val テストしたい値。
 * @return {boolean} 値が関数であれば true 。
 */
goog.isFunction = function(val) {
  return goog.typeOf(val) == 'function';
};


/**
 * 値がオブジェクトであれば true を返す。この場合オブジェクトは、配列や関数を含
 * む。
 * @param {*} val テストしたい値。
 * @return {boolean} 値がオブジェクトであれば true 。
 */
goog.isObject = function(val) {
  var type = typeof val;
  return type == 'object' && val != null || type == 'function';
  // <code>return Object(val) === val</code> でもよいが、これは値がオブジェクト
  // でないときに遅い。
};


/**
 * 与えられたオブジェクトのユニークな値を返す。この値は、オブジェクトが与えら
 * れた場合に変化しない。このユニークな ID は現在のセッションのなかで同一である
 * ことが保証される。つまり、セッションをまたいだ場合には保証されない。
 * ユニークな値が prototype オブジェクトに与えられた場合は動作が不安定となる。
 *
 * @param {Object} obj ユニークな値を取得したいオブジェクト。
 * @return {number} このオブジェクトのユニークな値。
 */
goog.getUid = function(obj) {
  // TODO(arv): Make the type stricter, do not accept null.

  // In Opera window.hasOwnProperty exists but always returns false so we avoid
  // using it. As a consequence the unique ID generated for BaseClass.prototype
  // and SubClass.prototype will be the same.
  return obj[goog.UID_PROPERTY_] ||
      (obj[goog.UID_PROPERTY_] = ++goog.uidCounter_);
};


/**
 * オブジェクトからユニークな値を消去する。これはユニークな ID をもつオブジェク
 * トが変化していて {@code goog.getUid} の値を変えたい場合に使うことができる。
 * @param {Object} obj ユニークな ID を取り除きたいオブジェクト。
 */
goog.removeUid = function(obj) {
  // TODO(arv): Make the type stricter, do not accept null.

  // DOM nodes in IE are not instance of Object and throws exception
  // for delete. Instead we try to use removeAttribute
  if ('removeAttribute' in obj) {
    obj.removeAttribute(goog.UID_PROPERTY_);
  }
  /** @preserveTry */
  try {
    delete obj[goog.UID_PROPERTY_];
  } catch (ex) {
  }
};


/**
 * ユニークな ID のプロパティ名。この作業によって 1 つのページで違う Closure が
 * 動作する際に衝突を回避的できる。
 * @type {string}
 * @private
 */
goog.UID_PROPERTY_ = 'closure_uid_' +
    Math.floor(Math.random() * 2147483648).toString(36);


/**
 * ユニークな ID のカウンタ。
 * @type {number}
 * @private
 */
goog.uidCounter_ = 0;


/**
 * ハッシュをオブジェクトに追加する。このハッシュは。オブジェクト毎に固有の値で
 * ある。
 * @param {Object} obj ハッシュを作成したいオブジェクト。
 * @return {number} このオブジェクトのハッシュ値。
 * @deprecated {@link goog.getUid} を使うべき。
 */
goog.getHashCode = goog.getUid;


/**
 * ハッシュをオブジェクトから削除する。
 * @param {Object} obj ハッシュを取り除きたいオブジェクト。
 * @deprecated {@link goog.getUid} を使うべき。
 */
goog.removeHashCode = goog.removeUid;


/**
 * 与えられた値を複製する。オブジェクト・配列・基本的な型が与えられた場合には、
 * 再帰的に複製される。
 *
 * @warning {@link goog.cloneObject} は循環参照を検知できない。オブジェクトが自
 *     身を参照する場合には無限に再帰処理がおこなわれてしまう。
 *
 * @warning {@link goog.cloneObject} はユニークな値が複製されることを防げない。
 *     {@link goog.getUid} によって作られたユニークな値も複製されてしまう。
 *
 * @param {*} obj 複製したいオブジェクト。
 * @return {*} 複製されたオブジェクト。
 * @deprecated {@link goog.cloneObject} は安全でない。{@link goog.object} のメ
 *      ソッドの方がよい。
 */
goog.cloneObject = function(obj) {
  var type = goog.typeOf(obj);
  if (type == 'object' || type == 'array') {
    if (obj.clone) {
      return obj.clone();
    }
    var clone = type == 'array' ? [] : {};
    for (var key in obj) {
      clone[key] = goog.cloneObject(obj[key]);
    }
    return clone;
  }

  return obj;
};


/**
 * 複製用のメソッドをあらかじめ定義しておく。これはコンパイラが
 * {@link goog.cloneObject} を利用したスクリプトのダックタイピングをサポートする
 * のに必要。
 *
 * TODO(brenneman): Remove once the JSCompiler can infer that the check for
 * proto.clone is safe in goog.cloneObject.
 *
 * @type {Function}
 */
Object.prototype.clone;


/**
 * {@link goog.bind} のネイティブな実装。
 * @param {Function} fn A function to partially apply.
 * @param {Object|undefined} selfObj Specifies the object which |this| should
 *     point to when the function is run.
 * @param {...*} var_args Additional arguments that are partially
 *     applied to the function.
 * @return {!Function} A partially-applied form of the function bind() was
 *     invoked as a method of.
 * @private
 * @suppress {deprecated} The compiler thinks that Function.prototype.bind
 *     is deprecated because some people have declared a pure-JS version.
 *     Only the pure-JS version is truly deprecated.
 */
goog.bindNative_ = function(fn, selfObj, var_args) {
  return /** @type {!Function} */ (fn.call.apply(fn.bind, arguments));
};


/**
 * A pure-JS implementation of goog.bind.
 * @param {Function} fn A function to partially apply.
 * @param {Object|undefined} selfObj Specifies the object which |this| should
 *     point to when the function is run.
 * @param {...*} var_args Additional arguments that are partially
 *     applied to the function.
 * @return {!Function} A partially-applied form of the function bind() was
 *     invoked as a method of.
 * @private
 */
goog.bindJs_ = function(fn, selfObj, var_args) {
  if (!fn) {
    throw new Error();
  }

  if (arguments.length > 2) {
    var boundArgs = Array.prototype.slice.call(arguments, 2);
    return function() {
      // Prepend the bound arguments to the current arguments.
      var newArgs = Array.prototype.slice.call(arguments);
      Array.prototype.unshift.apply(newArgs, boundArgs);
      return fn.apply(selfObj, newArgs);
    };

  } else {
    return function() {
      return fn.apply(selfObj, arguments);
    };
  }
};


/**
 * 与えられたオブジェクトが関数の 'this' オブジェクトとなるような新しい関数を返
 * す。引数が指定された場合は、引数も暗黙的に新しい関数に与えられる（関数の部分
 * 適用 + 'this' の束縛）。
 *
 * これによって生成された関数に引数が与えられた場合、暗黙的に与えられた関数に続
 * いて指定される。
 *
 * こちらも参照： {@link goog.partial}
 *
 * 引数の振る舞い：
 * <pre>var barMethBound = goog.bind(myFunction, myObj, 'arg1', 'arg2');
 * barMethBound('arg3', 'arg4');</pre>
 *
 * @note orga.chem.job@gmail.com (OrgaChem) 
 * 上の引数の振る舞いは、
 * <pre>barMethBound('arg3', 'arg4')</pre>
 * が下のようなコードと等価であるということです。
 * <pre>myFunction.call(myObj, 'arg1', 'arg2', 'arg3', 'arg4')</pre>
 *
 * @param {Function} fn 部分適用 + 'this' の束縛をしたい関数。
 * @param {Object|undefined} selfObj 与えられた関数の 'this' にしたいオブジェク
 *     ト。
 * @param {...*} var_args 関数の部分適用で与えられる可変長引数。
 * @return {!Function} 引数の部分適用 + 'this' が束縛された新しい関数。
 * @suppress {deprecated} 下を参照。
 */
goog.bind = function(fn, selfObj, var_args) {
  // TODO(nicksantos): narrow the type signature.
  if (Function.prototype.bind &&
      // NOTE(nicksantos): Somebody pulled base.js into the default
      // Chrome extension environment. This means that for Chrome extensions,
      // they get the implementation of Function.prototype.bind that
      // calls goog.bind instead of the native one. Even worse, we don't want
      // to introduce a circular dependency between goog.bind and
      // Function.prototype.bind, so we have to hack this to make sure it
      // works correctly.
      Function.prototype.bind.toString().indexOf('native code') != -1) {
    goog.bind = goog.bindNative_;
  } else {
    goog.bind = goog.bindJs_;
  }
  return goog.bind.apply(null, arguments);
};


/**
 * {@link goog.bind} と似た動作をするが、関数の部分適用のみがなされた関数を返
 * す。
 *
 * 引数の振る舞い：
 * var g = goog.partial(f, arg1, arg2);
 * g(arg3, arg4);
 *
 * @note orga.chem.job@gmail.com (OrgaChem) 
 * 上の引数の振る舞いは、
 * <pre>g('arg3', 'arg4')</pre>
 * が下のようなコードと等価であるということです。
 * <pre>f.call(this, 'arg1', 'arg2', 'arg3', 'arg4')</pre>
 *
 * @param {Function} fn 部分適用したい関数。
 * @param {...*} var_args 部分適用された関数に与えられる可変長引数。
 * @return {!Function} 引数が部分適用された新しい関数。
 */
goog.partial = function(fn, var_args) {
  var args = Array.prototype.slice.call(arguments, 1);
  return function() {
    // Prepend the bound arguments to the current arguments.
    var newArgs = Array.prototype.slice.call(arguments);
    newArgs.unshift.apply(newArgs, args);
    return fn.apply(this, newArgs);
  };
};


/**
 * 片方のオブジェクトのすべてのメンバをもう一方のオブジェクトに加える。
 * この関数は toString や hasOwnProperty のような名前のキーがある場合は動作しな
 * い。この目的では {@link goog.object.extend} を使う。
 * @param {Object} target メンバが追加されるオブジェクト。
 * @param {Object} source 追加したいメンバをもつオブジェクト。
 */
goog.mixin = function(target, source) {
  for (var x in source) {
    target[x] = source[x];
  }

  // For IE7 or lower, the for-in-loop does not contain any properties that are
  // not enumerable on the prototype object (for example, isPrototypeOf from
  // Object.prototype) but also it will not include 'replace' on objects that
  // extend String and change 'replace' (not that it is common for anyone to
  // extend anything except Object).
};


/**
 * @return {number} 1970 年 1 月から今までに経過した時間をミリ秒の単位で返す。
 */
goog.now = Date.now || (function() {
  // Unary plus operator converts its operand to a number which in the case of
  // a date is done by calling getTime().
  return +new Date();
});


/**
 * Evals javascript in the global scope.  In IE this uses execScript, other
 * browsers use goog.global.eval. If goog.global.eval does not evaluate in the
 * global scope (for example, in Safari), appends a script tag instead.
 * Throws an exception if neither execScript or eval is defined.
 * グローバルスコープで JavaScript を実行する。 IE 上であれば execScript を使
 * い、IE 以外のブラウザでは {@link goog.global.eval} を使う。もし、 Safari のよ
 * うに {@link goog.global.eval} がグローバルスコープで実行されない場合はスクリ
 * プトタグの埋め込みよって実現する。 execScript か ecal が定義されていなければ
 * エラーが発生する。
 * @param {string} script JavaScript 文字列。
 */
goog.globalEval = function(script) {
  if (goog.global.execScript) {
    goog.global.execScript(script, 'JavaScript');
  } else if (goog.global.eval) {
    // Test to see if eval works
    if (goog.evalWorksForGlobals_ == null) {
      goog.global.eval('var _et_ = 1;');
      if (typeof goog.global['_et_'] != 'undefined') {
        delete goog.global['_et_'];
        goog.evalWorksForGlobals_ = true;
      } else {
        goog.evalWorksForGlobals_ = false;
      }
    }

    if (goog.evalWorksForGlobals_) {
      goog.global.eval(script);
    } else {
      var doc = goog.global.document;
      var scriptElt = doc.createElement('script');
      scriptElt.type = 'text/javascript';
      scriptElt.defer = false;
      // Note(user): can't use .innerHTML since "t('<test>')" will fail and
      // .text doesn't work in Safari 2.  Therefore we append a text node.
      scriptElt.appendChild(doc.createTextNode(script));
      doc.body.appendChild(scriptElt);
      doc.body.removeChild(scriptElt);
    }
  } else {
    throw Error('goog.globalEval not available');
  }
};


/**
 * 'eval' によってグローバルスコープで関すが実行できるようであれば true にセット
 * される。値は {@link goog.globalEval} の初回の呼び出しのタイミングでセットされ
 * る。
 * @type {?boolean}
 * @private
 */
goog.evalWorksForGlobals_ = null;


/**
 * Optional map of CSS class names to obfuscated names used with
 * goog.getCssName().
 * @type {Object|undefined}
 * @private
 * @see goog.setCssNameMapping
 */
goog.cssNameMapping_;


/**
 * Optional obfuscation style for CSS class names. Should be set to either
 * 'BY_WHOLE' or 'BY_PART' if defined.
 * @type {string|undefined}
 * @private
 * @see goog.setCssNameMapping
 */
goog.cssNameMappingStyle_;


/**
 * Handles strings that are intended to be used as CSS class names.
 *
 * This function works in tandem with @see goog.setCssNameMapping.
 *
 * Without any mapping set, the arguments are simple joined with a
 * hyphen and passed through unaltered.
 *
 * When there is a mapping, there are two possible styles in which
 * these mappings are used. In the BY_PART style, each part (i.e. in
 * between hyphens) of the passed in css name is rewritten according
 * to the map. In the BY_WHOLE style, the full css name is looked up in
 * the map directly. If a rewrite is not specified by the map, the
 * compiler will output a warning.
 *
 * When the mapping is passed to the compiler, it will replace calls
 * to goog.getCssName with the strings from the mapping, e.g.
 *     var x = goog.getCssName('foo');
 *     var y = goog.getCssName(this.baseClass, 'active');
 *  becomes:
 *     var x= 'foo';
 *     var y = this.baseClass + '-active';
 *
 * If one argument is passed it will be processed, if two are passed
 * only the modifier will be processed, as it is assumed the first
 * argument was generated as a result of calling goog.getCssName.
 *
 * @param {string} className The class name.
 * @param {string=} opt_modifier A modifier to be appended to the class name.
 * @return {string} The class name or the concatenation of the class name and
 *     the modifier.
 */
goog.getCssName = function(className, opt_modifier) {
  var getMapping = function(cssName) {
    return goog.cssNameMapping_[cssName] || cssName;
  };

  var renameByParts = function(cssName) {
    // Remap all the parts individually.
    var parts = cssName.split('-');
    var mapped = [];
    for (var i = 0; i < parts.length; i++) {
      mapped.push(getMapping(parts[i]));
    }
    return mapped.join('-');
  };

  var rename;
  if (goog.cssNameMapping_) {
    rename = goog.cssNameMappingStyle_ == 'BY_WHOLE' ?
        getMapping : renameByParts;
  } else {
    rename = function(a) {
      return a;
    };
  }

  if (opt_modifier) {
    return className + '-' + rename(opt_modifier);
  } else {
    return rename(className);
  }
};


/**
 * Sets the map to check when returning a value from goog.getCssName(). Example:
 * <pre>
 * goog.setCssNameMapping({
 *   "goog": "a",
 *   "disabled": "b",
 * });
 *
 * var x = goog.getCssName('goog');
 * // The following evaluates to: "a a-b".
 * goog.getCssName('goog') + ' ' + goog.getCssName(x, 'disabled')
 * </pre>
 * When declared as a map of string literals to string literals, the JSCompiler
 * will replace all calls to goog.getCssName() using the supplied map if the
 * --closure_pass flag is set.
 *
 * @param {!Object} mapping A map of strings to strings where keys are possible
 *     arguments to goog.getCssName() and values are the corresponding values
 *     that should be returned.
 * @param {string=} opt_style The style of css name mapping. There are two valid
 *     options: 'BY_PART', and 'BY_WHOLE'.
 * @see goog.getCssName for a description.
 */
goog.setCssNameMapping = function(mapping, opt_style) {
  goog.cssNameMapping_ = mapping;
  goog.cssNameMappingStyle_ = opt_style;
};


/**
 * To use CSS renaming in compiled mode, one of the input files should have a
 * call to goog.setCssNameMapping() with an object literal that the JSCompiler
 * can extract and use to replace all calls to goog.getCssName(). In uncompiled
 * mode, JavaScript code should be loaded before this base.js file that declares
 * a global variable, CLOSURE_CSS_NAME_MAPPING, which is used below. This is
 * to ensure that the mapping is loaded before any calls to goog.getCssName()
 * are made in uncompiled mode.
 *
 * A hook for overriding the CSS name mapping.
 * @type {Object|undefined}
 */
goog.global.CLOSURE_CSS_NAME_MAPPING;


if (!COMPILED && goog.global.CLOSURE_CSS_NAME_MAPPING) {
  // This does not call goog.setCssNameMapping() because the JSCompiler
  // requires that goog.setCssNameMapping() be called with an object literal.
  goog.cssNameMapping_ = goog.global.CLOSURE_CSS_NAME_MAPPING;
}


/**
 * Abstract implementation of goog.getMsg for use with localized messages.
 * @param {string} str Translatable string, places holders in the form {$foo}.
 * @param {Object=} opt_values Map of place holder name to value.
 * @return {string} message with placeholders filled.
 */
goog.getMsg = function(str, opt_values) {
  var values = opt_values || {};
  for (var key in values) {
    var value = ('' + values[key]).replace(/\$/g, '$$$$');
    str = str.replace(new RegExp('\\{\\$' + key + '\\}', 'gi'), value);
  }
  return str;
};


/**
 * Exposes an unobfuscated global namespace path for the given object.
 * Note that fields of the exported object *will* be obfuscated,
 * unless they are exported in turn via this function or
 * goog.exportProperty
 *
 * <p>Also handy for making public items that are defined in anonymous
 * closures.
 *
 * ex. goog.exportSymbol('public.path.Foo', Foo);
 *
 * ex. goog.exportSymbol('public.path.Foo.staticFunction',
 *                       Foo.staticFunction);
 *     public.path.Foo.staticFunction();
 *
 * ex. goog.exportSymbol('public.path.Foo.prototype.myMethod',
 *                       Foo.prototype.myMethod);
 *     new public.path.Foo().myMethod();
 *
 * @param {string} publicPath Unobfuscated name to export.
 * @param {*} object Object the name should point to.
 * @param {Object=} opt_objectToExportTo The object to add the path to; default
 *     is |goog.global|.
 */
goog.exportSymbol = function(publicPath, object, opt_objectToExportTo) {
  goog.exportPath_(publicPath, object, opt_objectToExportTo);
};


/**
 * Exports a property unobfuscated into the object's namespace.
 * ex. goog.exportProperty(Foo, 'staticFunction', Foo.staticFunction);
 * ex. goog.exportProperty(Foo.prototype, 'myMethod', Foo.prototype.myMethod);
 * @param {Object} object Object whose static property is being exported.
 * @param {string} publicName Unobfuscated name to export.
 * @param {*} symbol Object the name should point to.
 */
goog.exportProperty = function(object, publicName, symbol) {
  object[publicName] = symbol;
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * Usage:
 * <pre>
 * function ParentClass(a, b) { }
 * ParentClass.prototype.foo = function(a) { }
 *
 * function ChildClass(a, b, c) {
 *   goog.base(this, a, b);
 * }
 * goog.inherits(ChildClass, ParentClass);
 *
 * var child = new ChildClass('a', 'b', 'see');
 * child.foo(); // works
 * </pre>
 *
 * In addition, a superclass' implementation of a method can be invoked
 * as follows:
 *
 * <pre>
 * ChildClass.prototype.foo = function(a) {
 *   ChildClass.superClass_.foo.call(this, a);
 *   // other code
 * };
 * </pre>
 *
 * @param {Function} childCtor Child class.
 * @param {Function} parentCtor Parent class.
 */
goog.inherits = function(childCtor, parentCtor) {
  /** @constructor */
  function tempCtor() {};
  tempCtor.prototype = parentCtor.prototype;
  childCtor.superClass_ = parentCtor.prototype;
  childCtor.prototype = new tempCtor();
  /** @override */
  childCtor.prototype.constructor = childCtor;
};


/**
 * Call up to the superclass.
 *
 * If this is called from a constructor, then this calls the superclass
 * contructor with arguments 1-N.
 *
 * If this is called from a prototype method, then you must pass
 * the name of the method as the second argument to this function. If
 * you do not, you will get a runtime error. This calls the superclass'
 * method with arguments 2-N.
 *
 * This function only works if you use goog.inherits to express
 * inheritance relationships between your classes.
 *
 * This function is a compiler primitive. At compile-time, the
 * compiler will do macro expansion to remove a lot of
 * the extra overhead that this function introduces. The compiler
 * will also enforce a lot of the assumptions that this function
 * makes, and treat it as a compiler error if you break them.
 *
 * @param {!Object} me Should always be "this".
 * @param {*=} opt_methodName The method name if calling a super method.
 * @param {...*} var_args The rest of the arguments.
 * @return {*} The return value of the superclass method.
 */
goog.base = function(me, opt_methodName, var_args) {
  var caller = arguments.callee.caller;
  if (caller.superClass_) {
    // This is a constructor. Call the superclass constructor.
    return caller.superClass_.constructor.apply(
        me, Array.prototype.slice.call(arguments, 1));
  }

  var args = Array.prototype.slice.call(arguments, 2);
  var foundCaller = false;
  for (var ctor = me.constructor;
       ctor; ctor = ctor.superClass_ && ctor.superClass_.constructor) {
    if (ctor.prototype[opt_methodName] === caller) {
      foundCaller = true;
    } else if (foundCaller) {
      return ctor.prototype[opt_methodName].apply(me, args);
    }
  }

  // If we did not find the caller in the prototype chain,
  // then one of two things happened:
  // 1) The caller is an instance method.
  // 2) This method was not called by the right caller.
  if (me[opt_methodName] === caller) {
    return me.constructor.prototype[opt_methodName].apply(me, args);
  } else {
    throw Error(
        'goog.base called from a method of one name ' +
        'to a method of a different name');
  }
};


/**
 * Allow for aliasing within scope functions.  This function exists for
 * uncompiled code - in compiled code the calls will be inlined and the
 * aliases applied.  In uncompiled code the function is simply run since the
 * aliases as written are valid JavaScript.
 * @param {function()} fn Function to call.  This function can contain aliases
 *     to namespaces (e.g. "var dom = goog.dom") or classes
 *    (e.g. "var Timer = goog.Timer").
 */
goog.scope = function(fn) {
  fn.call(goog.global);
};


