
var util = require('util');
require('./diet-joose');
require('./joose.singleton')


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
  } else {
    console.log('OK:'+title)
  }
}

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
ClassTest(Class('TestClass', {}));

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
  assert('MetaInstantiateTest:instantiate2', klass.meta.instantiate() instanceof MetaInstantiateTestClass);
}
MetaInstantiateTest(Class('MetaInstantiateTestClass', {
}))

function MetaInstantiateContructorParametersTest(klass) {
  var inst = klass.meta.instantiate('a', 'b', 'c');
  assertEQ('MetaInstantiateContructorParametersTest:a', inst.a, 'a');
  assertEQ('MetaInstantiateContructorParametersTest:b', inst.b, 'b');
  assertEQ('MetaInstantiateContructorParametersTest:c', inst.c, 'c');
}
MetaInstantiateContructorParametersTest(Class('MetaInstantiateContructorParametersTest', {
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
      is: "rw"
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
  for(var i in roles) {
    var role = roles[i]
    for(var method in role.meta.def.classMethods) {
      assertEQ('RoleClassDoes:class:'+method, klass[method](), role.meta.def.classMethods[method]())
    }
  }
  var instance = new klass()
  assertEQ('RoleClassDoes:instance.methods', instance.methods(), 'methods')
  for(var i in roles) {
    var role = roles[i]
    for(var method in role.meta.def.methods) {
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

//debugger;
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
})], Class('xClassTest', {
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

  assertEQ('secondchild.getX', secondchild.getX(), 4711)
  assertEQ('secondchild.getY', secondchild.getY(), 4712)

  assertEQ('secondchild.track.length', secondchild.track.length, 3)
  assertEQ('secondchild.track.0', secondchild.track[0], 'testBase')
  assertEQ('secondchild.track.1', secondchild.track[1], 'FirstChild')
  assertEQ('secondchild.track.2', secondchild.track[2], 'SecondChild')
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
  assertEQ("DefaultConstructor:y", ins.y, 7);

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
  assertEQ("DefaultConstructor:override:y", ins.y, 7);
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

function SingleTon() {
  Class('CSingleTon', {
    does: Joose.Singleton,
	 methods: {
		singletonInitialize: function() {
			this.specialInit = "Murks";
		} 
	 }
  });
  assertEQ('SingleTon:oid:', CSingleTon.getInstance()._oid, CSingleTon.getInstance()._oid);
  assertEQ('SingleTon:oid:', CSingleTon.getInstance().specialInit, CSingleTon.getInstance().specialInit);

  try {
//debugger;
	  var ins = new CSingleTon();
  } catch(e) {
  	assertEQ('SingleTon:new:', "The class CSingleTon is a singleton. Please use the class method getInstance().", e.message);
  }
}

SingleTon()

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


var start = new Date();
for(var c = 0000; c < 5000; ++c) {
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
console.log("15000 Klasses in msec:"+(end-start));


