var util = require('util');

(function() {
  var classParser = ['isa', 'classMethods', 'methods', 'has', 'does', 'before', 'after', 'around', 'override']
  var self = this;
  var Joose = {
    _: {
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
            var part = def[key];
            if (!part) { return }
            for(var i in part) {
              klass[i] = part[i];
            }
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
          Joose._.Class.helper.methods(name, key, klass, def);
        },
        methods: function(name, key, klass, def) {
          klass.prototype = klass.prototype || {};
          Joose._.Class.helper.methods(name, key, klass.prototype, def);
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
      def.meta = {
                    name: name,
                    isClass: false,
                    isRole: true
                 }
      if (!def.requires) { def.requires = []; }
      if (!Joose._.isArray(def.requires)) { def.requires = [def.requires]; }
      Joose._.Module.current[name] = def;
      return def;
    },
    Class: function(name, def) {
      //var klass_prototype = function() { };
      var klass = function() { };
      klass.meta = {
        name: name,
        isClass: true,
        isRole: false,
        inits: { values: [], keys: [] }
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




