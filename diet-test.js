
var Joose = require('./diet-joose').joose;

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
      this.track.push(this.meta.name)
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
      this.track.push(this.meta.name)
    }
  },
  methods: {
    methodsecondChild: function() { return "methodsecondChild" },
    methodtestBaseOverride: function() { return "methodsecondChildOverride" },
    methodfirstChildOverride: function() { return "methodsecondChildOverride" }
  }
}))


var start = new Date();
for(var c = 0; c < 5000; ++c) {
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


