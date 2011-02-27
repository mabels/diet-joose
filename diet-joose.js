var util = require('util');

Joose = (function() {
  var classParser = ['isa', 'classMethods', 'methods', 'has', 'does', 'before', 'after', 'around', 'override']
  var self = this;
  var Joose = {
    A: {
      each: function (array, func) {
          for(var i = 0, len = array.length; i < len; i++) {
              func(array[i], i)
          }
      },
      map: function(array, func) {
        var ret = [];
        Joose.A.each(array, function(a) { ret.push(func(a)); });
        return ret;
      },
      exists: function (array, v_or_c) {
         var comperator = v_or_c;
         if (typeof v_or_c != "function") {
             comperator = function(o) { return o == v_or_c; }
         }
         for(var i = 0, len = array.length; i < len; ++i) {
             if(comperator(array[i])) {
                 return true;
             }
         }
         return false;
      },
      reverse: function(array) {
        var ret = [];
        for(var i = array.length-1; i >= 0; --i) {
          ret.push(array[i]);
        }
        return ret;
      },
      find: function( array, func ) {
        var ret = null;
        Joose.A.exists(array, function(a) {
          if (func(a)) {
            ret = a;
            return true;
          }
          return false;
         });
         return ret;
      },

      deleteIf: function(array, func) {
        var ret = [];
        Joose.A.each(array, function(a) { if (!func(a)) { ret.push(a); } });
        return ret;
      },
      Permutation: function(attributes, func) {
        if (attributes.length > 2) {
          Joose.A.each(attributes, function(current) {
            var rest = [];
            Joose.A.each(attributes, function(j) { if (j != current) { rest.push(j); } });	
            Joose.A.Permutation(rest, function(result) {
                result.unshift(current);
                func(result);
            });
          });
        }	
        else if (attributes.length == 2) {
          func([attributes[0], attributes[1]]);
          func([attributes[1], attributes[0]]);
        }
        else if (attributes.length <= 1) {
          func(attributes);
        }
      },
      concat: function (source, array) {
          source.push.apply(source, array)
          return source
      },
      grep: function (array, func) {
          var a = [];
          Joose.A.each(array, function (t) {
              if(func(t)) {
                  a.push(t)
              }
          })
          return a
      },
      remove: function (array, removeEle) {
          var a = [];
          Joose.A.each(array, function (t) {
              if(t !== removeEle) {
                  a.push(t)
              }
          })
          return a
      }
    },
    S: {
      // Static helpers for Strings
      uppercaseFirst: function (string) { 
          return string.charAt(0).toUpperCase() + string.slice(1);
      },
      isString: function (thing) { 
          if(typeof thing == "string") {
              return true
          }
          return false
      },
      compare: function (a, b) {
        if (a == b) {
          return 0;
        }
        else if (a < b) {
          return -1;
        }
        return 1;
      }
    },
    O: {
    // Static helpers for objects
      each: function (object, func) {
          for(var i in object) {
              func(object[i], i)
          }
      },
      merge: function(target, merger) {
        var ret = {};
        Joose.O.each(target, function(o,k) { ret[k] = o; });
        Joose.O.each(merger, function(o,k) { ret[k] = o; });
        return ret;
      },	
      map: function(array, func) {
        var ret = {};
        Joose.O.each(array, function(v,k) { var o = func({key: k, value: v}); ret[o.key] = o.value; });
        return ret;
      },
      eachSafe: function (object, func) {
          for(var i in object) {
              if(object.hasOwnProperty(i)) {
                  func(object[i], i)
              }
          }
      },
      extend: function (target, newObject) {
          for(var i in newObject) {
              var thing = newObject[i]
              target[i] = thing
          }
      },
      values: function (object) {
        var ret = [];
        Joose.O.each(object, function(o) { ret.push(o); })
        return ret;
      },
      keys: function (object) {
        var ret = [];
        Joose.O.each(object, function(o, k) { ret.push(k); })
        return ret;
      }
    },
    _: {
      nameId: ~~(Math.random()*0xdeadbeaf),
      getName: function () {
        return 'Joose'+Joose._.nameId++;
      },
      firstUp: function (string) { 
        return string.charAt(0).toUpperCase() + string.slice(1);
      },
      isArray: Array.isArray || function(obj) { return toString.call(obj) === '[object Array]'; },

      Module: {
        base: self,
        current: self,
      },
      Class: {
        isa: function(name, key, klass, def) {
          var parts = def[key]
          if (!parts) { return; }
          if (!Joose._.isArray(parts)) { parts = [parts]; }
          var first = true;
          for(var i = parts.length - 1; i >= 0; --i) {
            var parent = parts[i];
            Joose._.Class.helper.methods(name, 'classMethods', klass, parent);
//console.log('STATICS:'+klass.meta.name+"=>"+parent.meta.name)
//console.log(Joose.O.keys(parent))
//console.log(Joose.O.keys(klass))
            if (first) {
                var func = function() {}
                func.prototype = parent.prototype;
                klass.prototype = new func();
            } else {
              Joose._.Class.helper.methods(name, 'methods', klass.prototype, parent.prototype);
            }
//console.log('PROTOTYPE:'+klass.meta.name+"=>"+parent.meta.name)
//console.log(Joose.O.keys(parent.prototype))
//console.log(Joose.O.keys(klass.prototype))
            first = false;
          }
        },
        does: function(name, key, klass, def) {
          var parts = def[key]
          if (!parts) { return; }
          if (!Joose._.isArray(parts)) { parts = [parts]; }
          for(var p in parts) { 
            var role = parts[p] 
            for (var i in role.requires) {
              var method = role.requires[i]
              if (!klass.prototype[method]) {
                throw "ERROR:Role["+role.meta.name+"] requires method ["+method+"] in class ["+klass.meta.name+"]"
              }
            }
            Joose._.Class.classMethods(name, 'classMethods', klass, role);
            Joose._.Class.methods(name, 'methods', klass, role);
          }
        },
        helper: {
          methods: function(name, key, klass, def) {
            var part = def;
            if (!part) { return }
            //var meta = part.meta;
            //delete part.meta;
            for(var i in part) {
              if (i != 'meta') {
                klass[i] = part[i];
              }
            }
            //part.meta = meta;
          },
          around: function (func, orig) {
              return function aroundWrapper () {
                  var bound = [(function(me) { return function () { return orig.apply(me, arguments); } })(this)];
                  return  func.apply(this, bound.push.apply(bound, arguments));
              }            
          },
          before: function (func, orig) {
              return function beforeWrapper () {
                  func.apply(this, arguments)
                  return orig.apply(this, arguments);
              }        
          },
          after: function (func, orig) {
              return function afterWrapper () {
                  var ret = orig.apply(this, arguments);
                  func.apply(this, arguments);
                  return ret;
              }
          },
          
          override: function (func, orig) {
              return function overrideWrapper () {
                  var bound = (function(me) { return function () { return orig.apply(me, arguments); } })(this);
                  var before  = this.SUPER;
                  this.SUPER  = bound;
                  var ret     = func.apply(this, arguments);
                  this.SUPER  = before;
                  return ret
              }            
          }
        },
        classMethods: function(name, key, klass, def) {
          Joose._.Class.helper.methods(name, key, klass, def[key]);
        },
        methods: function(name, key, klass, def) {
          klass.prototype = klass.prototype || {};
          Joose._.Class.helper.methods(name, key, klass.prototype, def[key]);
        },
        has: function(name, key, klass, def) {
          var part = def[key];
          if (!part) { return }
          var js = ['var hasser =  function(klass) {'];
          var jsc = klass.meta.inits;
          for(var i in part) {
            var fname = Joose._.firstUp(i);
            js.push('klass["get'+fname+'"] = function()    { return this["'+i+'"]; };');  
            js.push('klass["set'+fname+'"] = function(val) { this["'+i+'"] = val; return this; };');  
            var init = part[i].init;
            init && (jsc.keys.push(i) || jsc.values.push(init))
          }
          js.push('}')
          eval(js.join('')); // OPT could be also a colsure array but this will be slower
          hasser(klass.prototype);
        },
        before: function(name, key, klass, def) {
          var part = def[key];
          if (!part) { return }
          for(var i in part) {
            klass.prototype[i] = Joose._.Class.helper.before(part[i], klass.prototype[i]) 
          }
        },
        after: function(name, key, klass, def) {
          var part = def[key];
          if (!part) { return }
          for(var i in part) {
            klass.prototype[i] = Joose._.Class.helper.after(part[i], klass.prototype[i]) 
          }
        },
        around: function(name, key, klass, def) {
          var part = def[key];
          if (!part) { return }
          for(var i in part) {
            klass.prototype[i] = Joose._.Class.helper.around(part[i], klass.prototype[i]) 
          }
        },
        override: function(name, key, klass, def) {
          var part = def[key];
          if (!part) { return }
          for(var i in part) {
            klass.prototype[i] = Joose._.Class.helper.override(part[i], klass.prototype[i]) 
          }
        }
      }
    },
    Module: function(name, fn) {
      var parts   = name.split(".");
      var current = Joose._.Module.base;
      for(var i = 0, len = parts.length; i < len; ++i) {
        var part = parts[i];
        if (!current[part]) { current[part] = {}; }
        current = current[part];
      }
      if (typeof(fn) == 'function') { 
        Joose._.Module.prev_current = Joose._.Module.current;
        Joose._.Module.current = current;
        fn(current); 
        Joose._.Module.current = Joose._.Module.prev_current;
      }
    },
    Role: function(name, def) {
      if (!def) {
        def = name;
        name = Joose._.getName();
      }
      def.meta = {
                    name: name,
                    isClass: false,
                    isRole: true
                 }
      if (!def.requires) { def.requires = []; }
      if (!Joose._.isArray(def.requires)) { def.requires = [def.requires]; }

      if (!def.does) { def.does = []; }
      if (!Joose._.isArray(def.does)) { def.does = [def.does]; }

      for(var i in def.does) {
        var klazz = def.does[i]

        if (klazz.classMethods) { def.classMethods = def.classMethods || {}; }
        Joose._.Class.helper.methods(name, 'classMethods', def.classMethods, klazz.classMethods);

        if (klazz.methods) { def.methods = def.methods || {}; }
        Joose._.Class.helper.methods(name, 'methods', def.methods, klazz.methods);
      }
      Joose._.Module.current[name] = def;
      return def;
    },
    Class: function(name, def) {
      if (!def) {
        def = name;
        name = Joose._.getName();
      }
      //var klass_prototype = function() { };
      var klass = function() { };
      klass.meta = {
        name: name,
        isClass: true,
        isRole: false,
        inits: { values: [], keys: [] },
        def: def
        //class: klass_prototype 
      }
      for(var i in classParser) {
        var key = classParser[i];
        Joose._.Class[key](name, key, klass, def)
      }
      Joose._.Module.current[name] = klass;
      return klass;
    }
  }
  for (var i in Joose) {
    Joose._.Module.base[i] = Joose[i]
  }
  return Joose._.Module.base;
})()



function assert(title, c1) {
  if (c1) {
    assertEQ(title, true, true);
  }
  else {
    assertEQ(title, false, true);
  }
}
function assertEQ(title, c1, c2) {
  if (c1 != c2) {
    console.error('ERROR on:'+title+":"+c1+"!="+c2);
  } else {
    console.error('OK:'+title)
  }
}

function ModuleTest() {
  Module('Level1', function(m) { m.test = 'OK' })
  assertEQ('Module.Level1', Level1.test, 'OK')   

  Module('Level1.Level2.Level3', function(m) { m.test = 'OK' })
  assertEQ('Module.Level1.Level2.Level3', Level1.Level2.Level3.test, 'OK')

  Module('Level0.Level1.Level2.Level3', function(m) { m.test = 'OK' })
  assertEQ('Module.Level0.Level1.Level2.Level3', Level0.Level1.Level2.Level3.test, 'OK')
}
ModuleTest();

function ClassTest(klass) {
  assert('ClassTest', klass)
  assert('ClassTest', new klass())
}
ClassTest(Class('TestClass', {}));

function ClassMetaTest(name, klass) {
  assert('ClassTest:meta:'+name, klass.meta)
  assertEQ('ClassTest:meta:name:'+name, klass.meta.name, name)
}

ClassMetaTest('TestClass', Class('TestClass', {}));


function MethodsTest(names, klass) {
//console.log('MethodsTest:'+util.inspect(new klass()))
  for(var i in names) {
    var name = names[i]
    for(var j in name) {
      assertEQ('MethodsTest:Function:'+j+':', typeof((new klass())[j]), 'function')
      assertEQ('MethodsTest:Return:'+j+':', (new klass())[j](), name[j])
    }
  }
}

MethodsTest([{'testBase': 'testBase'}], Class('TestClass', {
  methods: {
    testBase: function() { return 'testBase' }
  }
}));
  
function ClassMethodsTest(names, klass) {
  for(var i in names) {
    var name = names[i]
    for(var j in name) {
      assert('ClassMethodsTest:Function:'+j+':', typeof(klass[j]) == 'function')
      assert('ClassMethodsTest:Return:'+j+':', (klass[j])() == name[j])
    }
  }
}

ClassMethodsTest([{'testBase': 'classtestBase'}], Class('TestClass', {
  classMethods: {
    testBase: function() { return 'classtestBase' }
  },
  methods: {
    testBase: function() { return 'membertestBase' }
  }
}));


function SetGetTest(names, klass) {
  for(var i in names) {
    var name = names[i]
    for(var j in name) {
      var instance = new klass();
      assertEQ('SetGetTest:SetTest:'+j+':', instance['set'+j](name[j]), instance)
      assertEQ('SetGetTest:GetTest:'+j+':', instance['get'+j](), name[j])
    }
  }
}
  
SetGetTest([{'Test': '4711'}], Class('TestClass', {
  has: {
    test: {
      is: "rw",
    }
  }
}));

function AopTest(callback, step, klass) {
  var instance = new klass();
  var idx = 0;
  var my = function(arg) {
    assertEQ('AopTest:'+klass.meta.name+":"+step[idx], arg, step[idx])
    idx++;
    return my;
  }
  assertEQ('AopTest:'+klass.meta.name+':ret:', instance[callback](my), step[idx]);
}
  

AopTest('beforeCallBack', ['before', 'orig', 'last'], Class('BeforeTest', {
  methods: {
    beforeCallBack: function(fn) {
      fn('orig')
      return 'last';
    }
  },
  before: {
    beforeCallBack: function(fn) {
      return fn('before') 
    }
  }
}));

AopTest('afterCallBack', ['orig', 'after', 'last'], Class('AfterTest', {
  methods: {
    afterCallBack: function(fn) {
      fn('orig')
      return 'last'
    }
  },
  after: {
    afterCallBack: function(fn) {
      return fn('after') 
    }
  }
}));
  
AopTest('overrideCallBack', ['before', 'orig', 'after', 'last'], Class('OverrideTest', {
  methods: {
    overrideCallBack: function(fn) {
      return fn('orig');
    }
  },
  override: {
    overrideCallBack: function(fn) {
      this.SUPER(fn('before'));
      fn('after')
      return 'last';
    }
  }
}));

function RoleDefinitionTest(name, role) {
  assertEQ('RoleDefinitionTest:isClass', role.meta.isClass, false);
  assertEQ('RoleDefinitionTest:isRole', role.meta.isRole, true)
  assertEQ('RoleDefinitionTest:name', role.meta.name, name)
}

RoleDefinitionTest('RoleTest', Role('RoleTest', {
  classMethods: {
    roleClassMethod: function() { return "roleClassMethod"; }
  },
  methods: {
    roleMethod: function() { return "roleMethod"; }
  }
}))

function RoleClassDoes(roles, klass) {
  assertEQ('RoleClassDoes:class.methods', klass.methods(), 'classMethods')
  for(var i in roles) {
    var role = roles[i]
    for(var method in role.classMethods) {
      assertEQ('RoleClassDoes:class:'+method, klass[method](), role.classMethods[method]())
    }
  }
  var instance = new klass()
  assertEQ('RoleClassDoes:instance.methods', instance.methods(), 'methods')
  for(var i in roles) {
    var role = roles[i]
    for(var method in role.methods) {
      assertEQ('RoleClassDoes:instance:'+method, instance[method](), role.methods[method]())
    }
  }
}

function RoleClassDoesFailure(exp, roles, klass) {
  try {
    RoleClassDoes(roles, klass());
  } catch(e) {
    assertEQ('RoleClassDoesFailure', exp, e)
  }
}

RoleClassDoes([Role('RoleTest', {
  requires: 'methods',
  classMethods: {
    roleClassMethod: function() { return "roleClassMethod"; }
  },
  methods: {
    roleMethod: function() { return "roleMethod"; }
  }
})], Class('ClassTest', {
  does: RoleTest,
  classMethods: {
    methods: function() { return "classMethods"; }
  },
  methods: {
    methods: function() { return "methods"; }
  }
}))


RoleClassDoesFailure('ERROR:Role[RoleTest] requires method [Failure] in class [ClassTest]', [Role('RoleTest', {
  requires: 'Failure',
  classMethods: {
    roleClassMethod: function() { return "roleClassMethod"; }
  },
  methods: {
    roleMethod: function() { return "roleMethod"; }
  }
})], function() { Class('ClassTest', {
  does: RoleTest,
  classMethods: {
    methods: function() { return "classMethods"; }
  },
  methods: {
    methods: function() { return "methods"; }
  }
}) })

RoleClassDoes([Role('RoleTest0', {
  requires: 'method0',
  classMethods: {
    classRoleTest0: function() { return "classRoleTest0"; }
  },
  methods: {
    instanceRoleTest0: function() { return "instanceRoleTest0"; }
  }
}),
Role('RoleTest1', {
  requires: 'method1',
  classMethods: {
    classRoleTest1: function() { return "classRoleTest1"; }
  },
  methods: {
    instanceRoleTest1: function() { return "instanceRoleTest1"; }
  }
})], Class('ClassTest', {
  does: [RoleTest0, RoleTest1],
  classMethods: {
    methods: function() { return "classMethods"; }
  },
  methods: {
    methods: function() { return "methods"; },
    method0: function() { return "method0"; },
    method1: function() { return "method1"; }
  }
}))



RoleClassDoes([Role('RoleTest0', {
  requires: 'method0',
  does: Role('RoleTest1', {
          requires: 'method1',
          classMethods: {
            classRoleTest1: function() { return "classRoleTest1"; }
          },
          methods: {
            instanceRoleTest1: function() { return "instanceRoleTest1"; }
          }
        }),
  classMethods: {
    classRoleTest0: function() { return "classRoleTest0"; }
  },
  methods: {
    instanceRoleTest0: function() { return "instanceRoleTest0"; }
  }
})], Class('ClassTest', {
  does: [RoleTest0],
  classMethods: {
    methods: function() { return "classMethods"; }
  },
  methods: {
    methods: function() { return "methods"; },
    method0: function() { return "method0"; },
    method1: function() { return "method1"; }
  }
}))


function IsaTest(klazz) {
  assertEQ('TestBase.methodtestBase', TestBase.methodtestBase(), 'classMethodtestBase');
  assertEQ('TestBase.methodtestBaseOverride', TestBase.methodtestBaseOverride(), 'classMethodtestBaseOverride')
  var testbase = new TestBase();
  assertEQ('testbase.methodtestBase', testbase.methodtestBase(), 'methodtestBase')
  assertEQ('testbase.methodtestBaseOverride', testbase.methodtestBaseOverride(), 'methodtestBaseOverride')


//console.log('FIRST:'+JSON.stringify(Joose.O.keys(FirstChild)))
  assertEQ('FirstChild.methodtestBase', FirstChild.methodtestBase(), 'classMethodtestBase');
  assertEQ('FirstChild.methodfirstChild', FirstChild.methodfirstChild(), 'classMethodfirstChild');
  assertEQ('FirstChild.methodtestBaseOverride', FirstChild.methodtestBaseOverride(), 'classMethodfirstChildOverride')
  assertEQ('FirstChild.methodfirstChildOverride', FirstChild.methodfirstChildOverride(), 'classMethodfirstChildOverride')

  var firstchild = new FirstChild();
  assertEQ('firstchild.methodtestBase', firstchild.methodtestBase(), 'methodtestBase');
  assertEQ('firstchild.methodfirstChild', firstchild.methodfirstChild(), 'methodfirstChild');
  assertEQ('firstchild.methodtestBaseOverride', firstchild.methodtestBaseOverride(), 'methodfirstChildOverride')
  assertEQ('firstchild.methodfirstChildOverride', firstchild.methodfirstChildOverride(), 'methodfirstChildOverride')

  assertEQ('SecondChild.methodtestBase', SecondChild.methodtestBase(), 'classMethodtestBase');
  assertEQ('SecondChild.methodfirstChild', SecondChild.methodfirstChild(), 'classMethodfirstChild');
  assertEQ('SecondChild.methodsecondChild', SecondChild.methodsecondChild(), 'classMethodsecondChild');
  assertEQ('SecondChild.methodtestBaseOverride', SecondChild.methodtestBaseOverride(), 'classMethodsecondChildOverride')
  assertEQ('SecondChild.methodfirstChildOverride', SecondChild.methodfirstChildOverride(), 'classMethodsecondChildOverride')

  var secondchild = new SecondChild();
  assertEQ('secondchild.methodtestBase', secondchild.methodtestBase(), 'methodtestBase');
  assertEQ('secondchild.methodfirstChild', secondchild.methodfirstChild(), 'methodfirstChild');
  assertEQ('secondchild.methodsecondChild', secondchild.methodsecondChild(), 'methodsecondChild');
  assertEQ('secondchild.methodtestBaseOverride', secondchild.methodtestBaseOverride(), 'methodsecondChildOverride')
  assertEQ('secondchild.methodfirstChildOverride', secondchild.methodfirstChildOverride(), 'methodsecondChildOverride')
}

IsaTest(Class('SecondChild', {
  isa: Class('FirstChild', {
          isa: Class('TestBase', {
                has: {
                  x: {
                        is: "rw",
                        init: 0
                     }
                },
                classMethods: {
                  methodtestBase: function() { return "classMethodtestBase" },
                  methodtestBaseOverride: function() { return "classMethodtestBaseOverride" }
                },
                methods: {
                  initialize: function() { 
                    this.track = ['testBase'] 
                  },
                  methodtestBase: function() { return "methodtestBase" },
                  methodtestBaseOverride: function() { return "methodtestBaseOverride" }
                }
          }),
          classMethods: {
            methodfirstChild: function() { return "classMethodfirstChild" },
            methodtestBaseOverride: function() { return "classMethodfirstChildOverride" },
            methodfirstChildOverride: function() { return "classMethodfirstChildOverride" }
          },
          override: {
            initialize: function() {
              this.SUPER();
              this.track.push('FirstChild')
            }
          },
          methods: {
            methodfirstChild: function() { return "methodfirstChild" },
            methodtestBaseOverride: function() { return "methodfirstChildOverride" },
            methodfirstChildOverride: function() { return "methodfirstChildOverride" }
          }
 }),
  classMethods: {
    methodsecondChild: function() { return "classMethodsecondChild" },
    methodtestBaseOverride: function() { return "classMethodsecondChildOverride" },
    methodfirstChildOverride: function() { return "classMethodsecondChildOverride" }
  },
  override: {
    initialize: function() {
      this.SUPER();
      this.track.push(this.meta.getName())
    }
  },
  methods: {
    methodsecondChild: function() { return "methodsecondChild" },
    methodtestBaseOverride: function() { return "methodsecondChildOverride" },
    methodfirstChildOverride: function() { return "methodsecondChildOverride" }
  }
}))


IsaTest(Class('SecondChild', {
  isa: [Class('FirstChild', {
          does: Role('RoleTestBase', {
                has: {
                  x: {
                        is: "rw",
                        init: 0
                     }
                },
                classMethods: {
                  methodtestBase: function() { return "classMethodtestBase" },
                  methodtestBaseOverride: function() { return "classMethodfirstChildOverride" }
                },
                methods: {
                  initialize: function() { 
                    this.track = ['testBase'] 
                  },
                  methodtestBase: function() { return "methodtestBase" },
                  methodtestBaseOverride: function() { return "methodfirstChildOverride" }
                }
          }),
          classMethods: {
            methodfirstChild: function() { return "classMethodfirstChild" },
            methodtestBaseOverride: function() { return "classMethodfirstChildOverride" },
            methodfirstChildOverride: function() { return "classMethodfirstChildOverride" }
          },
          override: {
            initialize: function() {
              this.SUPER();
              this.track.push('FirstChild')
            }
          },
          methods: {
            methodfirstChild: function() { return "methodfirstChild" },
            methodtestBaseOverride: function() { return "methodfirstChildOverride" },
            methodfirstChildOverride: function() { return "methodfirstChildOverride" }
          }
       }), Class('TestBase', {
          has: {
            x: {
                  is: "rw",
                  init: 0
               }
          },
          classMethods: {
            methodtestBase: function() { return "classMethodtestBase" },
            methodtestBaseOverride: function() { return "classMethodtestBaseOverride" }
          },
          methods: {
            initialize: function() { 
              this.track = ['testBase'] 
            },
            methodtestBase: function() { return "methodtestBase" },
            methodtestBaseOverride: function() { return "methodtestBaseOverride" }
          }
          })],
  classMethods: {
    methodsecondChild: function() { return "classMethodsecondChild" },
    methodtestBaseOverride: function() { return "classMethodsecondChildOverride" },
    methodfirstChildOverride: function() { return "classMethodsecondChildOverride" }
  },
  override: {
    initialize: function() {
      this.SUPER();
      this.track.push(this.meta.getName())
    }
  },
  methods: {
    methodsecondChild: function() { return "methodsecondChild" },
    methodtestBaseOverride: function() { return "methodsecondChildOverride" },
    methodfirstChildOverride: function() { return "methodsecondChildOverride" }
  }
}))


