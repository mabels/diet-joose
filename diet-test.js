
/*
if (typeof(require) == 'undefined' && typeof(imports) == 'object') {
  var require = function(a) { return imports[a]; }
  var console = {
              log: print,
              error: print
            }
} else */ if (typeof(require) == 'undefined' && typeof(load) == 'function') {
  // Rhino
  require = function(a) { return load(a+'.js'); }
  console = {
              log: print,
              error: print
            }
} else {
  if (typeof require == 'undefined') {
    // Browser
    require = function() { }
  }
}

require('./json2')
require('./diet-joose');
require('./joose.singleton')
require('./joose.storage')
require('./joose.types')

var missedAsserts = 0;

function assert(title, c1) {
  if (c1) {
    assertEQ(title, true, true);
  }
  else {
    assertEQ(title, false, true);
  }
}
if (typeof $ != 'undefined') {
  if (typeof console == 'undefined') {
    console = {}
  }
  var toArray = function(a) {
    var ret = [];
    for(var i = 0; i < a.length; ++i) {
      ret.push(a[i]); 
    }
    return ret;
  }
  console.log= function() {
                $('<pre style="margin: 0; color: green;">'+toArray(arguments).join(",")+'</pre>').appendTo($('body'))
              }
  console.error= function() {
                $('<pre style="margin: 0; color: red;">'+toArray(arguments).join(",")+'</pre>').appendTo($('body'))
              }
}
function assertEQ(title, c1, c2) {
  if (c1 != c2) {
    console.error('ERROR on:'+title+":"+c1+"!="+c2);
    missedAsserts++;
  } else {
    console.log('OK:'+title)
  }
}
function assertEQO(title, c1, c2) {
  if (c1 !== c2) {
    console.error('ERROR on:'+title+":"+c1+"!="+c2);
    missedAsserts++;
  } else {
    console.log('OK:'+title)
  }
}

Array.prototype.forMurks = function() { console.log("ForMurks-Called"); throw new Error("ForMurks-Called") }

function ModuleTest() {
  Module('Level1', function(m) { m.test = 'OK' })
  assertEQ('Module.Level1', Level1.test, 'OK')   

  Module('Level1.Level2.Level3', function(m) { m.test = 'OK' })
  assertEQ('Module.Level1.Level2.Level3', Level1.Level2.Level3.test, 'OK')

  Module('Level0.Level1.Level2.Level3', function(m) { m.test = 'OK' })
  assertEQ('Module.Level0.Level1.Level2.Level3', Level0.Level1.Level2.Level3.test, 'OK')

  Module('Level10', function(m) { 
    Module('Level11', function(m) { 
      Module('Level12', function(m) { 
      })
    })
  })
  assertEQ('Level10:relative', Level10.meta._name.relative, 'Level10');
  assertEQ('Level10:absolute', Level10.meta._name.absolute, 'Level10');

  assertEQ('Level11:relative', Level10.Level11.meta._name.relative, 'Level11');
  assertEQ('Level11:absolute', Level10.Level11.meta._name.absolute, 'Level10.Level11');

  assertEQ('Level12:relative', Level10.Level11.Level12.meta._name.relative, 'Level12');
  assertEQ('Level12:absolute', Level10.Level11.Level12.meta._name.absolute, 'Level10.Level11.Level12');

  Module('Level0.Level1.Level2.Level3', function(m) { 
    m.test = 'OK';
    Class('Class4', { });
    Role('Role4', { });
  })
  assertEQ('Module.Level0.Level1.Level2.Level3', Level0.Level1.Level2.Level3.test, 'OK')
  assertEQ('Module.Level0.Level1.Level2.Level3', Level0.Level1.Level2.Level3.meta._name.absolute, 'Level0.Level1.Level2.Level3')
  assertEQ('Module.Level0.Level1.Level2.Level3:Class4', Level0.Level1.Level2.Level3.Class4.meta._name.absolute, 'Level0.Level1.Level2.Level3.Class4')
  assertEQ('Module.Level0.Level1.Level2.Level3:Role4',  Level0.Level1.Level2.Level3.Role4.meta._name.absolute, 'Level0.Level1.Level2.Level3.Role4')
  Class('Level0.Level1.Level2.Level3.Class5', { });
  Role('Level0.Level1.Level2.Level3.Role5', { });
  assertEQ('Module.Level0.Level1.Level2.Level3:Class5:abs', Level0.Level1.Level2.Level3.Class5.meta._name.absolute, 'Level0.Level1.Level2.Level3.Class5')
  assertEQ('Module.Level0.Level1.Level2.Level3:Role5:abs',  Level0.Level1.Level2.Level3.Role5.meta._name.absolute, 'Level0.Level1.Level2.Level3.Role5')
  assertEQ('Module.Level0.Level1.Level2.Level3:Class5:rel', Level0.Level1.Level2.Level3.Class5.meta._name.relative, 'Class5')
  assertEQ('Module.Level0.Level1.Level2.Level3:Role5:rel',  Level0.Level1.Level2.Level3.Role5.meta._name.relative, 'Role5')

}
ModuleTest();

function ClassTest(klass) {
  assert('ClassTest', klass)
  assert('ClassTest', new klass())
}
ClassTest(Class('EmptyTestClass', {}));

var top = (function() { return this; })();
function MetaTest(name, klass) {
  assert('MetaTest:'+name.absolute, klass.meta)
  assertEQ('MetaTest:name:rel:'+name.absolute, klass.meta._name.relative, name.relative)
  assertEQ('MetaTest:name:abs:'+name.absolute, klass.meta._name.absolute, name.absolute)
  assertEQ('MetaTest:getName:'+name.absolute, klass.meta.getName(), name.absolute)
  var types = ['isModule', 'isRole', 'isClass'];
  for(var i = 0; i < types.length; ++i) {
	 if (types[i] != name.type) {
  		assertEQ('MetaTest:type:'+name.absolute, klass.meta[types[i]], false)
	 } 
  }
  assert('MetaTest:type:'+name.absolute, klass.meta[name.type])

  var split = name.absolute.split('.')
  var base = top;
  for(var i = 0; i < split.length; ++i) {
	 base = base[split[i]]
  }
  assert('MetaTest:type:'+name.absolute, base.meta.getName(), name.absolute);
  assert('MetaTest:type:'+name.absolute, base.meta[name.type]);
  for(var i = 0; i < types.length; ++i) {
	 if (types[i] != name.type) {
  		assertEQ('MetaTest:type:'+name.absolute, base.meta[types[i]], false)
	 } 
  }
}

MetaTest({relative: 'CTestClass', absolute: 'CTestClass', type: 'isClass' }, Class('CTestClass', {}));
MetaTest({relative: "CTestClass", absolute: 'CTest.CTestClass', type: 'isClass'}, Class('CTest.CTestClass', {}));

MetaTest({relative: 'RTestClass', absolute: 'RTestClass', type: 'isRole' }, Role('RTestClass', {}));
MetaTest({relative: "RTestClass", absolute: 'RTest.RTestClass', type: 'isRole'}, Role('RTest.RTestClass', {}));

MetaTest({relative: 'MTestClass', absolute: 'MTestClass', type: 'isModule' }, Module('MTestClass', function(){}));
MetaTest({relative: "MTestClass", absolute: 'MTest.MTestClass', type: 'isModule'}, Module('MTest.MTestClass', function(){}));

function MetaClassTest(exp, klass) {
  assertEQ('MetaClassTest:class', klass.meta['class'].myClassMethod(), exp);
  assertEQ('MetaClassTest:c', klass.meta.c.myClassMethod(), exp);
}

MetaClassTest('myClassMethod', Class('CTestMetaClass', {
  classMethods: {
    myClassMethod: function() { return "myClassMethod" }
  }
}))


function MetaInstantiateTest(klass) {
  assertEQ('MetaInstantiateTest:instantiate1', typeof klass.meta.instantiate, 'function');
  var inst = klass.meta.instantiate();
  assert('MetaInstantiateTest:instantiate2', inst instanceof MetaInstantiateTestClass);
  assertEQ('MetaInstantiateTest:classMethod', inst.meta['class'].classMethod(), 'classMethod');
  assertEQ('MetaInstantiateTest:method', inst.method(), 'method');
}
MetaInstantiateTest(Class('MetaInstantiateTestClass', {
  classMethods: {
    classMethod: function() { return 'classMethod'; }
  },
  methods: {
    method: function() { return 'method'; }
  }
}))

function MetaInstantiateContructorParametersTest(klass) {
  var inst = klass.meta.instantiate('a', 'b', 'c');
  assertEQ('MetaInstantiateContructorParametersTest:a', inst.a, 'a');
  assertEQ('MetaInstantiateContructorParametersTest:b', inst.b, 'b');
  assertEQ('MetaInstantiateContructorParametersTest:c', inst.c, 'c');
}
MetaInstantiateContructorParametersTest(Class('MetaInstantiateContructorParametersTestClass', {
  methods: {
    initialize: function(a, b, c) {
      this.a = a;
      this.b = b;
      this.c = c;
    }
  }
}))


function MethodsTest(names, klass) {
//console.log('MethodsTest:'+util.inspect(new klass()))
  for(var i = names.length - 1; i >=0; --i) {
    var name = names[i]
    for(var j in name) {
      assertEQ('MethodsTest:Function:'+j+':', typeof((new klass())[j]), 'function')
      assertEQ('MethodsTest:Return:'+j+':', (new klass())[j](), name[j])
    }
  }
}

MethodsTest([{'testBase': 'testBase'}], Class('u1TestClass', {
  methods: {
    testBase: function() { return 'testBase' }
  }
}));

(function TestGetInstanceMethods(clazz) {
  var methods = clazz.meta.getInstanceMethods();
  assertEQ('TestGetInstanceMethods:size', methods.length, 2);
  if (methods[0].getName() == 'm1') {
    assertEQ('TestGetInstanceMethods:name:m2', methods[1].getName(), 'm2');
  } else {
    assertEQ('TestGetInstanceMethods:name:m2', methods[0].getName(), 'm2');
  }
}(Class('GetInstanceMethodsClass', {
  classMethods: {
    cm : function() { return 'cm'; }
  },
  methods: {
    m1: function() { return 'm1'; },
    m2: function() { return 'm2'; }
  }
})));

function ClassMethodsTest(names, klass) {
  for(var i = names.length -1; i >= 0; --i) {
    var name = names[i]
    for(var j in name) {
      assert('ClassMethodsTest:Function:'+j+':', typeof(klass[j]) == 'function')
      assert('ClassMethodsTest:Return:'+j+':', (klass[j])() == name[j])
    }
  }
}

ClassMethodsTest([{'testBase': 'classtestBase'}], Class('u2TestClass', {
  classMethods: {
    testBase: function() { return 'classtestBase' }
  },
  methods: {
    testBase: function() { return 'membertestBase' }
  }
}));


function SetGetTest(names, klass) {
  for(var i = names.length - 1; i >= 0; --i) {
    var name = names[i]
    for(var j in name) {
      var instance = new klass();
      assertEQ('SetGetTest:SetTest:'+j+':', instance['set'+j](name[j].set), instance)
      assertEQ('SetGetTest:GetTest:'+j+':', instance['get'+j](), name[j].get)
    }
  }
}
  
SetGetTest([{'Test': {set: '4711', get: '4711'}}], Class('u3TestClass', {
  has: {
    test: {
      is: "rw"
    }
  }
}));

SetGetTest([{'Test': {set: '4713', get: '47131'}}], Class('xTestClass', {
  has: {
    test: {
      is: "rw"
    }
  },
  methods: {
    setTest: function(a) {
      this.o = a + 1;
      return this;
    },
    getTest: function() {
      return this.o;
    }
  }
}));

function AopTest(title, callback, step, klass) {
  var instance = new klass();
  var idx = 0;
  var my = function(arg) {
    assertEQ('AopTest:'+title+":"+klass.meta.getName()+":"+step[idx], arg, step[idx])
    idx++;
    return my;
  }
  assertEQ('AopTest:'+title+":"+klass.meta.getName()+':ret:', instance[callback](my), step[idx]);
}
  
/* Without Role */
AopTest('Class', 'beforeCallBack', ['before', 'orig', 'last'], Class('BeforeTest', {
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

AopTest('Class', 'afterCallBack', ['orig', 'after', 'last'], Class('AfterTest', {
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
  
AopTest('Class', 'overrideCallBack', ['before', 'orig', 'after', 'last'], Class('OverrideTest', {
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

//console.log('OverrideTest'+util.inspect(OverrideTest.meta.aops))
//console.log('AfterTest'+util.inspect(AfterTest.meta.aops))

/* With Role */
AopTest('Role', 'beforeCallBack', ['before', 'orig', 'last'], Class('BeforeTest', {
  methods: {
    beforeCallBack: function(fn) {
      fn('orig')
      return 'last';
    }
  },
  does: Role({
    before: {
      beforeCallBack: function(fn) {
        return fn('before') 
      }
    }
  })
}));

AopTest('Role', 'afterCallBack', ['orig', 'after', 'last'], Class('AfterTest', {
  methods: {
    afterCallBack: function(fn) {
      fn('orig')
      return 'last'
    }
  },
  does: Role({
    after: {
      afterCallBack: function(fn) {
        return fn('after') 
      }
    }
  })
}));
  
AopTest('Role', 'overrideCallBack', ['before', 'orig', 'after', 'last'], Class('OverrideTest', {
  methods: {
    overrideCallBack: function(fn) {
      return fn('orig');
    }
  },
  does: Role({
    override: {
      overrideCallBack: function(fn) {
        this.SUPER(fn('before'));
        fn('after')
        return 'last';
      }
    }
  })
}));


function RoleDefinitionTest(name, role) {
  assertEQ('RoleDefinitionTest:isClass', role.meta.isClass, false);
  assertEQ('RoleDefinitionTest:isRole', role.meta.isRole, true)
  assertEQ('RoleDefinitionTest:name', role.meta.getName(), name)
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
  for(var i = roles.length - 1; i >= 0; --i) {
    var role = roles[i]
    for (var method in role.meta.def.classMethods) {
      assertEQ('RoleClassDoes:class:'+method, klass[method](), role.meta.def.classMethods[method]())
    }
  }
  var instance = new klass()
  assertEQ('RoleClassDoes:instance.methods', instance.methods(), 'methods')
  for(var i = roles.length - 1; i >= 0; --i) {
    var role = roles[i]
    for (var method in role.meta.def.methods) {
      assertEQ('RoleClassDoes:instance:'+method, instance[method](), role.meta.def.methods[method]())
    }
  }
}

function RoleClassDoesFailure(exp, roles, klass) {
  try {
    RoleClassDoes(roles, klass());
  } catch(e) {
    assertEQ('RoleClassDoesFailure', exp, e.message)
  }
}
//---------------------------------------------------------------
var theClass = Class('ClassTest42', {
  
  classMethods: {
    methods: function() { return "classMethods"; }
  },
  methods: {
    methods: function() { return "methods"; }
  }
});
var theParentRole = Role('RoleParentTest42', {
  classMethods: {
    parentClassMethod: function() { return "parentClassMethod"; }
  },
  methods: {
    parentRoleMethod: function() { return "parentRoleMethod"; }
  }
});

var theRole = Role('RoleTest42', {
	does: theParentRole,
  classMethods: {
    roleClassMethod: function() { return "roleClassMethod"; }
  },
  methods: {
    roleMethod: function() { return "roleMethod"; }
  }
});
theClass.apply(theRole);
RoleClassDoes([theParentRole, theRole], theClass);
//---------------------------------------------------------------

RoleClassDoes([Role('RoleTest', {
  requires: 'methods',
  classMethods: {
    roleClassMethod: function() { return "roleClassMethod"; }
  },
  methods: {
    roleMethod: function() { return "roleMethod"; }
  }
})], Class('xClassTest', {
  does: RoleTest,
  classMethods: {
    methods: function() { return "classMethods"; }
  },
  methods: {
    methods: function() { return "methods"; }
  }
}))
//---------------------------------------------------------------

RoleClassDoesFailure('Role[RoleTest] requires method [Failure] in class [xClassTest]', [Role('RoleTest', {
  requires: 'Failure',
  classMethods: {
    roleClassMethod: function() { return "roleClassMethod"; }
  },
  methods: {
    roleMethod: function() { return "roleMethod"; }
  }
})], function() { Class('xClassTest', {
  does: RoleTest,
  classMethods: {
    methods: function() { return "classMethods"; }
  },
  methods: {
    methods: function() { return "methods"; }
  }
}) })


RoleClassDoes([
Role('RoleTest0', {
  requires: 'method0',
  classMethods: {
    classRoleTest0: function() { return "classRoleTest0"; }
  },
  methods: {
    instanceRoleTest0: function() { return "instanceRoleTest0"; }
  }
}),
Role('RoleTest1', {
  requires: ['method1'],
  classMethods: {
    classRoleTest1: function() { return "classRoleTest1"; }
  },
  methods: {
    instanceRoleTest1: function() { return "instanceRoleTest1"; }
  }
})
],
Class('xClassTest', {
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

var parentRole = Role('RoleTest1', {
          requires: 'method1',
          classMethods: {
            classRoleTest1: function() { return "classRoleTest1"; }
          },
          methods: {
            instanceRoleTest1: function() { return "instanceRoleTest1"; }
          }
        });
RoleClassDoes([Role('RoleTest0', {
  requires: 'method0',
  does: parentRole,
  classMethods: {
    classRoleTest0: function() { return "classRoleTest0"; }
  },
  methods: {
    instanceRoleTest0: function() { return "instanceRoleTest0"; }
  }
}), parentRole], Class('xClassTest', {
  does: [RoleTest0],
  classMethods: {
    methods: function() { return "classMethods"; }
  },
  methods: {
    methods: function() { return "methods"; },
    method0: function() { return "method0"; },
    method1: function() { return "method1"; }
  }
}));

(function() {
  var RoleToApply = Role('RoleToApply', {
    classMethods: {
      rcm: function() { return "rcm"; },
      cm: function() { return "cm-from-role"; }
    },
    methods: {
      rm: function() { return "rm"; },
      m: function() { return "m-from-role"; }
    }
  });
  var clazzToApplyRoleTo = Class('ClazzToApplyRoleTo', {
    classMethods: {
      cm: function() { return "cm"; }
    },
    methods: {
      m: function() { return "m"; }
    }
  });
  RoleToApply.meta.apply(clazzToApplyRoleTo);
  var inst = new clazzToApplyRoleTo();
  assertEQ('ClazzToApplyRoleTo:cm', clazzToApplyRoleTo.cm(), 'cm');
  assertEQ('ClazzToApplyRoleTo:rcm', clazzToApplyRoleTo.rcm(), 'rcm');
  assertEQ('ClazzToApplyRoleTo:m', inst.m(), 'm');
  assertEQ('ClazzToApplyRoleTo:rm', inst.rm(), 'rm');
}());

//--------------------------------------------------------------------

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

  //ERROR on:firstchild.methodtestBaseOverride-:methodsecondChildOverride!=methodfirstChildOverride
  //ERROR on:firstchild.methodfirstChildOverride-:methodsecondChildOverride!=methodfirstChildOverride
  assertEQ('firstchild.methodtestBaseOverride', firstchild.methodtestBaseOverride(), 'methodfirstChildOverride')
  assertEQ('firstchild.methodfirstChildOverride', firstchild.methodfirstChildOverride(), 'methodfirstChildOverride');


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

  assertEQ('secondchild.getX', secondchild.getX(), 4711)
  assertEQ('secondchild.getY', secondchild.getY(), 4712)
  assertEQ('secondchild.getZ', secondchild.getZ(), "methodtestBase");

  assertEQ('secondchild.track.length', secondchild.track.length, 3)
  assertEQ('secondchild.track.0', secondchild.track[0], 'testBase')
  assertEQ('secondchild.track.1', secondchild.track[1], 'FirstChild')
  assertEQ('secondchild.track.2', secondchild.track[2], 'SecondChild')
//exit(0);
}

IsaTest(Class('SecondChild', {
  isa: Class('FirstChild', {
          isa: Class('TestBase', {
                has: {
                  x: {
                        is: "rw",
                        init: 4711
                     },
                  y: {
                        is: "rw",
                        init: function() { return 4712 }
                     },
                  z: {
                        is: "rw",
                        init: function() { return this.methodtestBase(); }
                     }
                },
                classMethods: {
                  methodtestBase: function() { return "classMethodtestBase" },
                  methodtestBaseOverride: function() { return "classMethodtestBaseOverride" }
                },
                methods: {
                  initialize: function() { 
                    this.track = ['testBase'] 
//console.log('TestBase:initialize');
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
//console.log('FirstChild:initialize');
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
//console.log('SecondChild:initialize:'+Joose.O.keys(this));
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
                        init: 4711
                     },
                  y: {
                        is: "rw",
                        init: function() { return 4712 }
                     },
                  z: {
                        is: "rw",
                        init: function() { return this.methodtestBase(); }
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

function DefaultConstructor() {
  Class('ClassDefaultConstructor', {
    has: {
      x: { 
            init: 4
         }
    }
  })
  var ins = new ClassDefaultConstructor({ x: 9, y: 7});
  assertEQ("DefaultConstructor:getX", ins.getX(), 9);
  assertEQ("DefaultConstructor:y", ins.y, undefined);

  Class('ClassDefaultConstructor', {
    has: {
      x: { 
            init: 4
         }
    },
    override: {
      initialize: function() {
        this.z = 18;
      }
    }
  })
  var ins = new ClassDefaultConstructor({ x: 9, y: 7});
  assertEQ("DefaultConstructor:override:getX", ins.getX(), 9);
  assertEQ("DefaultConstructor:override:y", ins.y, undefined);
  assertEQ("DefaultConstructor:override:z", ins.z, 18);

  Class('PropertiesShouldNotOverrideMethods', {
    has: {
      x: { init: 2 }
    },
    methods: {
      method: function() { return "method"; }
    }
  })
  ins = new PropertiesShouldNotOverrideMethods({ x: 5, method: "property" });
  assertEQ('PropertiesShouldNotOverrideMethods:x', ins.getX(), 5);
  assertEQ('PropertiesShouldNotOverrideMethods:method', typeof ins.method, 'function');
  assertEQ('PropertiesShouldNotOverrideMethods:method', ins.method(), 'method');
  
  Class('ClassWithFunctionConstructorInitializer', {
    has: {
      x: {}
    }
  });
  assertEQ('ClassWithFunctionConstructorInitializer:x', 
        new ClassWithFunctionConstructorInitializer({x: 5}).getX(), 5);
}

DefaultConstructor();

function ClassToString() {
  Class('xToString', {
  });
  assertEQ('ClassToString:toString', xToString.toString(), 'Joose:'+xToString.meta._name.absolute);
  var ins = new xToString();
  assertEQ('ClassToString:instance:toString', ins.toString(), xToString.meta._name.absolute+'<'+ins._oid+'>');
}

ClassToString();

(function SingleTon() {
  Class('CSingleTon', {
    does: Joose.Singleton,
    has: {
      prop: { init: 4 }
    },
    methods: {
      singletonInitialize: function() {
        this.specialInit = "Murks";
      } 
	 }
  });
  assertEQ('SingleTon:oid:', CSingleTon.getInstance()._oid, CSingleTon.getInstance()._oid);
  assertEQ('SingleTon:oid:', CSingleTon.getInstance().specialInit, CSingleTon.getInstance().specialInit);
  assertEQ('SingleTon:oid:prop', CSingleTon.getInstance().prop, 4);

  try {
//debugger;
	  var ins = new CSingleTon();
  } catch(e) {
  	assertEQ('SingleTon:new:', "The class CSingleTon is a singleton. Please use the class method getInstance().", e.message);
  }
})();



function MetaIsa(isit, klazz) {
	assertEQ('MetaIsa:true', klazz.meta.isa(isit), true); 
	assertEQ('MetaIsa:false', klazz.meta.isa(Class('Vogel', {})), false); 
}

MetaIsa(Class('Wurm', { }), Class('Gras', { isa: Class('Erde', { isa: Wurm }) }))

function RolesShouldNotOverrideClassMethods(exp, klass) {
  assertEQ('RolesShouldNotOverrideClassMethods', klass.dontOverride(), exp);
}

RolesShouldNotOverrideClassMethods('ImFromClass', Class('RoleDoesNotOverrideClassMethods', {
  does: Role('RoleCouldOverrideClassMethods', {
    classMethods: {
      dontOverride: function() { return 'ImFromRole'; } 
    }
  }),
  classMethods: {
    dontOverride: function() { return 'ImFromClass';
    }
  }
}))

RolesShouldNotOverrideClassMethods('ImFromRoleI', Class('RoleDoesNotOverrideClassMethods', {
  does: [Role('RoleI', {
                          classMethods: {
                            dontOverride: function() { return 'ImFromRoleI'; } 
                          }
         }), 
         Role('RoleII', {
                          classMethods: {
                            dontOverride: function() { return 'ImFromRoleII'; }
                          }
        })]
}))

function RolesShouldHaveClassMethods(exp, role) {
  assertEQ('RolesShouldHaveClassMethods', role.classMethod(), exp);
}

RolesShouldHaveClassMethods('roleClassMethod', Role('uu', {
  classMethods: {
    classMethod: function() { return 'roleClassMethod'; }
  }
}))

//----------- tests the inheritance from roles --------------------
function ClassDoesRoles(name, klass) {
  var instance = new klass()
	assertEQ("ClassDoesRoles", instance.getTheName(), name);
}

var roleA = Role('roleA', {
    methods: {
      getTheName: function() { return "roleA"; }
    }
  });
  
var roleAA = Role('roleAA', {
  does: roleA,
  methods: {
    getTheName: function() { return "roleAA"; }
  }
});

var roleB = Role('roleB', {
  methods: {
    getTheName: function() { return "roleB"; }
  }
});
  
var roleBB = Role('roleBB', {
  does: roleB,
  methods: {
    getTheName: function() { return "roleBB"; }
  }
});

var klassA = Class('classA', {
  does: [roleA]
});
ClassDoesRoles("roleA", klassA);

var klassAA = Class('classAA', {
  does: [roleAA]
});
ClassDoesRoles("roleAA", klassAA);

var klassB = Class('classB', {
  does: [roleA, roleB]
});
ClassDoesRoles("roleA", klassB);

var klassB2 = Class('classB2', {
  does: [roleAA, roleB]
});
ClassDoesRoles("roleAA", klassB2);

var klassNeu = Class('classNeu', {
  does: [roleAA, roleB],
  methods: {
  	getTheName: function() { return "classNeu"; }
  }
});
ClassDoesRoles("classNeu", klassNeu);

// -------------------------------------

function classNameToClassObjectTest() {
  Module('MclassNameToClassObjectTest', function() {
  })
  assert('Module:classNameToClassObjectTest', MclassNameToClassObjectTest.meta.classNameToClassObject);
  assertEQ('Class:classNameToClassObjectTest', MclassNameToClassObjectTest.meta.classNameToClassObject('MclassNameToClassObjectTest'), MclassNameToClassObjectTest);
  Role('RclassNameToClassObjectTest', {
  })
  assert('Role:classNameToClassObjectTest', RclassNameToClassObjectTest.meta.classNameToClassObject);
  assertEQ('Class:classNameToClassObjectTest', RclassNameToClassObjectTest.meta.classNameToClassObject('RclassNameToClassObjectTest'), RclassNameToClassObjectTest);
  Class('CclassNameToClassObjectTest', {
  })
  assert('Class:classNameToClassObjectTest', CclassNameToClassObjectTest.meta.classNameToClassObject);
  assertEQ('Class:classNameToClassObjectTest', CclassNameToClassObjectTest.meta.classNameToClassObject('CclassNameToClassObjectTest'), CclassNameToClassObjectTest);
}

classNameToClassObjectTest();

(function classNameToClassObjectTest2() {
  Module('MclassNameToClassObjectTest2', function(m) {
    Class('Class', {});
  });
  assertEQ('Class:classNameToClassObjectTest2', Joose.Class.meta.classNameToClassObject('MclassNameToClassObjectTest2.Class'), MclassNameToClassObjectTest2.Class);
})();

(function classWithMetaClassExtension() {
  Class('MetaClass', {
    methods: {
      handlePropvalidations: function(map) {
        this.addClassMethod("_getValidations", function() {
          return map;
        });
      }
    }
  })

  Class('ClassWithMetaClass', {
    meta: MetaClass,
    validations: {
      bla: 'bla',
      blub: 'blub'
    },
    classMethods: {
      getValidations: function() {
        return this._getValidations();
      }
    }
  })

  var validations = ClassWithMetaClass.getValidations()
  assertEQ('Class:classWithMetaClassExtension:validations:bla', validations['bla'], 'bla')
  assertEQ('Class:classWithMetaClassExtension:validations:bla', validations['blub'], 'blub')
})();

(function initWithFunctionBody() {
  Class('InitWithFunctionBody', {
    has: {
      prop: {
        is: "rw",
        init: function() { return "prop-val"; }
      }
    },
  });
  assertEQ('Class:initWithFunctionBody:prop', new InitWithFunctionBody().getProp(), 'prop-val');
})();


(function initWithValue() {
  Class('InitWithValue', {
    has: {
      prop: {
        is: "rw",
        init: 4711
      }
    },
  });
  assertEQ('Class:initWithValue:prop', new InitWithValue().getProp(), 4711);
})();

(function initFalseValues() {
  Class("InitFalseValues", {
    has: {
      _number0: {
        is: "rw",
        init: 0
      },
      _false: {
        is: "rw",
        init: false
      },
      _emptystring: {
        is: "rw",
        init: ""
      },
      _null: {
        is: "rw",
        init: null
      },
      _undefined: {
        is: "rw",
        init: undefined
      },
      _undefined_undefined: {
        is: "rw",
      }
    },
  })
  a = new InitFalseValues();
  assertEQO('Class:initFalseValues:number0', a.get_number0(), 0);
  assertEQO('Class:initFalseValues:false', a.get_false(), false);
  assertEQO('Class:initFalseValues:emptystring', a.get_emptystring(), "");
  assertEQO('Class:initFalseValues:null', a.get_null(), null);
  assertEQO('Class:initFalseValues:undefined', a.get_undefined(), undefined);
  assertEQO('Class:initFalseValues:undefined_undefined', a.get_undefined_undefined(), undefined);
})();


(function InitBaseAttributes() {
  Class("ibaBase", {
    does: Joose.Storage,
    has: {
      base: {
        is: "rw",
        init: 4711
      },
      key: {
        is: "rw",
        init: "TheKey"
      }
    }
  })
  Role("ibaRole", {
    has: {
      role: {
        is: "rw",
        init: 4611
      }
    }, 
    methods: {
      getRole: function() {
        return "ROLE"
      }
    }
  })
  Class("ibaChild", {
    isa: ibaBase,
    does: [ibaRole],
    has: {
      child: {
        is: "rw",
        init: 4712
      }
    }
  })
  Class("ibaChildChild", {
    isa: ibaChild,
    has: {
      child: {
        is: "rw",
        init: 4742
      }
    }
  })
  assertEQ('Class:InitBaseAttributes:ibaBase:plain:base',  (new ibaBase()).getBase(), 4711);
  assertEQ('Class:InitBaseAttributes:ibaChild:plain:base', (new ibaChild()).getBase(), 4711);
  assertEQ('Class:InitBaseAttributes:ibaChild:plain:base', (new ibaChild()).getChild(), 4712);
  assertEQ('Class:InitBaseAttributes:ibaChild:plain:role', (new ibaChild()).getRole(), "ROLE");
 
  assertEQ('Class:InitBaseAttributes:ibaBase:explict:base',  (new ibaBase({base: 4712})).getBase(), 4712);
  assertEQ('Class:InitBaseAttributes:ibaChild:explict:base', (new ibaChild({base: 4712})).getBase(), 4712);
  assertEQ('Class:InitBaseAttributes:ibaChild:explict:child', (new ibaChild({child: 4713})).getChild(), 4713);
  assertEQ('Class:InitBaseAttributes:ibaChild:explict:role', (new ibaChild({role: 4714})).getRole(), 4714);

  var attribs = (new ibaChild()).meta.getAttributes()
  assert('Class:InitBaseAttributes:ibaChild:JSON:child', attribs.child);
  assert('Class:InitBaseAttributes:ibaChild:JSON:base', attribs.base);
  assert('Class:InitBaseAttributes:ibaChild:JSON:key', attribs.key);
  assert('Class:InitBaseAttributes:ibaChild:JSON:role', attribs.role);

  assertEQ('Class:InitBaseAttributes:ibaChild:JSON:child', JSON.parse(JSON.stringify(new ibaChild())).child, 4712);
  assertEQ('Class:InitBaseAttributes:ibaChild:JSON:base', JSON.parse(JSON.stringify(new ibaChild())).base, 4711);
  assertEQ('Class:InitBaseAttributes:ibaChild:JSON:key', JSON.parse(JSON.stringify(new ibaChild())).key, "TheKey");
  assertEQ('Class:InitBaseAttributes:ibaChild:JSON:role', JSON.parse(JSON.stringify(new ibaChild())).role, 4611);
  try{
    assertEQ('Class:InitBaseAttributes:ibaChildChild:JSON:role', JSON.parse(JSON.stringify(new ibaChildChild())).child, 4742);
  }catch(e){
    assertEQ('Class:InitBaseAttributes:ibaChild:withoutDoes: ' + e, true, false);
  }

})();


var start = new Date();
for(var c = 5000; c < 5000; ++c) {
  _testbase = Class('TestBase'+c, {
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
  console.log('initialize:testBase')
      },
      methodtestBase: function() { return "methodtestBase" },
      methodtestBaseOverride: function() { return "methodtestBaseOverride" }
    }
  })

  //console.log('*******************FirstChild*******************************')
  _firstchild = Class('FirstChild'+c, {
    isa: _testbase,
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
  })

  //dump.apply(_firstchild.meta,[]);
  //return

  //for(var i in _testbase.meta.methods) {
  //console.log('TestBase=>'+i+':'+_testbase.meta.methods[i].getBody())
  //}
  //a=new _firstchild();
  //console.log("RESULT=>"+a.track)
  //return

  _secondchild = Class('SecondChild'+c, {
    isa: _firstchild,
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
  })

}
var end = new Date();
console.log("5000 Klasses in msec:"+(end.getTime()-start.getTime()));
missedAsserts > 0 && console.log('\n\t**** There where ' + missedAsserts + ' missed asserts ****\n')
