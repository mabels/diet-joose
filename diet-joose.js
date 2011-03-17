//var util = require('util');
if (typeof require == 'undefined') {
  require = function() { }
}

if (typeof window === 'undefined') {
  if (typeof exports === 'undefined' ) {
    var joosetop = this;
  } else {
    var joosetop = (function() { return this; })();
  }
} else {
  var joosetop = window;
}


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
    classParser: ['isa', 'classMethods', 'methods', 'has', 'does', 'before', 'after', 'around', 'override'],
    roleParser: ['classMethods', 'methods', 'has', 'before', 'after', 'around', 'override'],
    nameId: ~~(Math.random()*0xdeadbeaf),
    anonymousName: function () {
      return 'Joose'+Joose._.nameId++;
    },
    object: new Object(),
    firstUp: function (string) { 
      return string.charAt(0).toUpperCase() + string.slice(1);
    },
    isArray: Array.isArray || function(obj) { return this.object.toString.call(obj) === '[object Array]'; },

    Module: {
      base: joosetop,
      current: joosetop,
      buildName: function(name) {

        return (Joose._.Module.current.meta._name || (Joose._.Module.current.meta._name+'.')) + name;
      }
    },
    Class: {
      isa: function(key, klass, def) {
        var parts = def[key]
        if (!parts) { return; }
        if (!Joose._.isArray(parts)) { def[key] = parts = [parts]; }
        var first = true;
        for(var i = parts.length - 1; i >= 0; --i) {
          var parent = parts[i];
          Joose._.Class.helper.methods('classMethods', klass, parent);
          if (first) {
              var func = function() {}
              func.prototype = parent.prototype;
              klass.prototype = new func();
          } else {
            Joose._.Class.helper.methods('methods', klass.prototype, parent.prototype);
          }
          first = false;
        }
      },
      does: function(key, klass, def) {
        var parts = def[key]
        if (!parts) { return; }
        if (!Joose._.isArray(parts)) { def[key] = parts = [parts]; }
        // OPT possible to do this in one step
        var roles_to_apply = function(does, result, i) {
          result.push.apply(result, does);
          for(i = does.length-1; i>= 0; --i) {
            does[i].meta.def.does.length && roles_to_apply(does[i].meta.def.does, result);	
          }
          return result;
        }
        roles = roles_to_apply(parts, [])

        for(var p = 0, l = roles.length; p < l; ++p) {
          var role = roles[p]; 
          for (var i in role.meta.def.requires) {
            var method = role.meta.def.requires[i]
            if (!klass.prototype[method]) {
              throw new Error("Role["+role.meta.getName()+"] requires method ["+method+"] in class ["+klass.meta.getName()+"]");
            }
          }
          for(var i in Joose._.roleParser) {
            var key = Joose._.roleParser[i];
            Joose._.Class[key](key, klass, role.meta.def, 'classMethods' == key)
          }
        }
      },
      helper: {
        methodLoop: function(notOverride) {
          if (notOverride) {
            return function(klass, part) {
              for(var i in part) {
                !klass[i] && (klass[i] = part[i]);
              }
            } 
          } else {
            return function(klass, part) {
              for(var i in part) {
                klass[i] = part[i];
              }
            }
          }
        },
        methods: function(key, klass, def, notOverride) {
          var part = def;
          if (!part) { return }
          var meta = part['meta']; 
          if (meta) {
            delete part.meta;
            this.methodLoop(notOverride)(klass, part);
            part.meta = meta;
          } else {
            this.methodLoop(notOverride)(klass, part);
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
					 if (orig) { 	
						 return orig.apply(this, arguments);
					 } 
					 return null;
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
        },
        aop: function(key, klass, def, name) {
          var part = def[key];
          if (!part) { return }
          for(var i in part) {
            klass.prototype[i] = Joose._.Class.helper[name](part[i], klass.prototype[i]);
          }
        },
        instantiate: function() { 
          var f = function () {};
          f.prototype = this['class'].prototype;
          var obj = new f();
          obj.initialize.apply(obj, arguments);
          return obj;
        }
      },
      classMethods: function(key, klass, def, notOverride) {
        Joose._.Class.helper.methods(key, klass, def[key], notOverride);
      },
      methods: function(key, klass, def) {
        klass.prototype = klass.prototype || {};
        Joose._.Class.helper.methods(key, klass.prototype, def[key]);
      },
      has: function(key, klass, def) {
        var part = def[key];
        if (!part) { return }
        var js = ['var hasser =  function(klass) {'];
        var jsc = klass.meta.inits;
        for(var i in part) {
          var fname = Joose._.firstUp(i);
          js.push('klass["get'+fname+'"] = function()    { return this["'+i+'"]; };');  
          js.push('klass["set'+fname+'"] = function(val) { this["'+i+'"] = val; return this; };');  
          var init = part[i].init;
          if (init) {
            jsc.keys.push(i) 
            jsc.values.push(init)
          }
        }
        js.push('}')
        eval(js.join('')); // OPT could be also a colsure array but this will be slower
        hasser(klass.prototype);
      },
      before: function(key, klass, def) {
        Joose._.Class.helper.aop(key, klass, def, 'before'); 
      },
      after: function(key, klass, def) {
        Joose._.Class.helper.aop(key, klass, def, 'after'); 
      },
      around: function(key, klass, def) {
        Joose._.Class.helper.aop(key, klass, def, 'around'); 
      },
      override: function(key, klass, def) {
        Joose._.Class.helper.aop(key, klass, def, 'override'); 
      },
		_: {
		      toString: function() { return "Joose:"+this.meta._name.absolute; },
            meta: { 
							className: function() { return this._name.absolute; },
		 					isa: function(klazz, i, ret) {
								if (!this.def.isa) {
									return false;
								}
								ret = false;
								for(i = this.def.isa.length-1; i >= 0 && !ret; --i) {
									if (this.def.isa[i] === klazz) {
										ret = true;
									} else {
										ret = this.def.isa[i].meta.isa(klazz);	
									}
								} 
								return ret;
							}
						}
		},
		addMeta: function(klass) {
			klass.toString = this._.toString;	
			klass.meta.className = this._.meta.className;
			klass.meta.isa = this._.meta.isa;
		}
    },
    Meta: function(name, type, module) {
      return {
        _name: name || { relative: '', absolute: '' },
        getName: function() { return this._name.absolute; },
        isClass: type == 'Class',
        isModule: type == 'Module',
        isRole: type == 'Role',
        nsparent: module
      };
    }
  },
  Module: function(name, fn, type) {
    type = type || 'Module';
    var parts   = name.split(".");
    var current = Joose._.Module.current || Joose._.Module.base;
    var name = current.meta._name.absolute;
    var dot = current.meta._name.absolute == '' ? '' : '.';
    for(var i = 0, len = parts.length; i < len; ++i) {
      var part = parts[i];
      name = name + dot + part;
      if (!current[part]) { 
//console.log(Joose.O.keys(current), part);
        current[part] = { 
                          meta: Joose._.Meta({
                                               relative: part,
                                               absolute: name
                                             },(i == len-1 ? type : 'Module'), current)
                        }; 
      }
      current = current[part];
      dot = '.';
    }
    if (typeof(fn) == 'function') { 
      (function() {
        var prev_current = Joose._.Module.current || Joose._.Module.base;
        Joose._.Module.current = current;
		  var rethrow = false;
		  try {
			  fn(current); 
		  } catch (e) {
				rethrow = e;
		  }
        Joose._.Module.current = prev_current;
		  if (rethrow) {
				throw(rethrow);
		  }
      })()
    }
    return current;
  },
  Role: function(name, def) {
    if (!def) {
      def = name;
      name = Joose._.anonymousName();
    }
    return Joose.Module(name, function(current) {
//console.log('Define:Role:'+name+":"+current.meta.getName());
		 if (!def.requires) { def.requires = []; }
		 else if (!Joose._.isArray(def.requires)) { def.requires = [def.requires]; }
		 if (!def.does) { def.does = []; }
     else if (!Joose._.isArray(def.does)) { def.does = [def.does]; }
		 current.meta.def = def;
     Joose._.Class.helper.methods('', current, current.meta.def['classMethods']);
	 }, 'Role');
  },
  Class: function(name, def) {
    if (!def) {
      def = name;
      name = Joose._.anonymousName();
    }
    //var klass_prototype = function() { };
    var klass = function() { 
//console.log("Construct:"+util.inspect(this.meta._name));
      this.initialize && this.initialize.apply(this, arguments);
    };
    Joose.Module(name, function(current) {
//console.log(name, current);
		 klass.meta = current.meta;
		 klass.meta.inits = { values: [], keys: [] };
		 klass.meta.def = def;
		 klass.meta['class'] = klass;
		 klass.meta['c'] = klass;
       Joose._.Class.addMeta(klass);

		 for(var i in Joose._.classParser) {
			var key = Joose._.classParser[i];
			Joose._.Class[key](key, klass, def)
		 }
		 var inits = function(params) {
			if (this.toString === {}.toString) {
			  this._oid = this.oid || Joose._.nameId++;
			  this.toString = function() { 
				 return this.meta._name.absolute + '<' + (this._oid) +'>'; 
			  }
			}
			for(var i in klass.meta.inits.keys) {
			  var key = klass.meta.inits.keys[i];
			  var value = klass.meta.inits.values[i];
			  if (typeof(value) == 'function') {
				 this[key] = value();
			  } else {
				 this[key] = value;
			  }
			}
			if (typeof(params) == 'object') { 
			  for(var i in params) {
				 var fname = 'set'+Joose._.firstUp(i);
				 if (this[fname]) {
					this[fname](params[i]);
				 } else if (!this[i]) {
					this[i] = params[i];
				 }
			  }
			}
		 }
		 if (klass.prototype.initialize) {
			klass.prototype.initialize = Joose._.Class.helper.before(inits, klass.prototype.initialize);
		 } else {
			klass.prototype.initialize = inits;
		 }
     klass.meta.instantiate = Joose._.Class.helper.instantiate;
		 klass.prototype = klass.prototype || {}
		 klass.prototype.meta = klass.meta;
	//console.log(util.inspect(klass.meta._name));
		 current.meta.nsparent[klass.meta._name.relative] = klass;
    }, 'Class').meta;
    return klass;
  }
};

var old = Joose;

joosetop.Joose = function() {}
for(var i in old) {
	joosetop.Joose[i] = old[i];
}

joosetop.meta = Joose._.Meta(null, 'Module', joosetop);
Joose.joose = { joosetop: joosetop };
joosetop.Class = Joose.Class;
joosetop.Role = Joose.Role;
joosetop.Module = Joose.Module;

if (typeof exports !== 'undefined' ) {
  exports.joose = joosetop.Joose ;
}
