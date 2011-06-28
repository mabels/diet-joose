/*
 * Thx to all Commiters
 */


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
      for(var i = 0, len = array.length; i < len; ++i) {
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
        source.push.apply(source, array);
        return source
    },
    grep: function (array, func) {
        var a = [];
        Joose.A.each(array, function (t) {
            if(func(t)) {
                a.push(t);
            }
        })
        return a
    },
    remove: function (array, removeEle) {
        var a = [];
        Joose.A.each(array, function (t) {
            if(t !== removeEle) {
                a.push(t);
            }
        });
        return a;
    }
  },
  S: {
    // Static helpers for Strings
    uppercaseFirst: function (string) { 
        return string.charAt(0).toUpperCase() + string.slice(1);
    },
    
    isString: function (thing) { 
        return (typeof thing == "string");
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
            func(object[i], i);
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
                func(object[i], i);
            }
        }
    },
    extend: function (target, newObject) {
        for(var i in newObject) {
            var thing = newObject[i];
            target[i] = thing;
        }
    },
    values: function (object) {
      var ret = [];
      Joose.O.each(object, function(o) { ret.push(o); });
      return ret;
    },
    keys: function (object) {
      var ret = [];
      Joose.O.each(object, function(o, k) { ret.push(k); });
      return ret;
    }
  },
  _: {
    classParser: ['meta', 'isa', 'classMethods', 'has', 'methods', 'does', 'before', 'after', 'around', 'override'],
    roleParser: ['classMethods', 'has', 'methods', 'before', 'after', 'around', 'override'],
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
    Attribute: {
      helper: {
        isPersistent: function() {
          return !!this.persistent;
        },
        getGetterCode: function(fname, name, props) {
          return 'klass["get'+fname+'"] = function()    { return this["'+name+'"]; };';
        },
        getSetterCode: function(fname, name, props) {
          return 'klass["set'+fname+'"] = function(val) { this["'+name+'"] = val; return this; };';
        }
      }
    },
    Class: {
      meta: function(key, klass, def) {
        if (def['meta']) {
          var meta = def['meta'];
          for (var p in def) {
            var builder = meta.prototype['handleProp' + p];
            if (builder) {
              builder.call(klass.meta, def[p]);
            }
          }
        }
      },
      
      isa: function(key, klass, def) {
        var parts = def[key];
        if (!parts) { return; }
        if (!Joose._.isArray(parts)) { def[key] = parts = [parts]; }
        var first = true;
        for(var i = parts.length - 1; i >= 0; --i) {
          var parent = parts[i];
          Joose._.Class.helper.methods(klass, parent);
          if (first) {
              var func = function() {};
              func.prototype = parent.prototype;
              func.prototype.TEST = klass.meta.getName;
              klass.prototype = new func();
          } else {
            Joose._.Class.helper.methods(klass.prototype, parent.prototype);
          }
          first = false;
        }
      },
      
      does: function(key, klass, def) {
      	/*
      	 * "If the implementing class already has a method of the same name, it will not be overidden." (taken from the joose-HP)
      	 */
        var parts = def[key];
        if (!parts) { return; }
        if (!Joose._.isArray(parts)) { def[key] = parts = [parts]; }
        
        var applyRoleToClass = function(klass, role){
        	for(var i in Joose._.roleParser) {
              key = Joose._.roleParser[i];
              var notOverride = key == 'classMethods' || key == 'methods';
              Joose._.Class[key](key, klass, role.meta.def, notOverride);
            }
        };
        
        var roles = [];
        var applyDoes = function( theDoesRoles ){
        	/*
        	 * we iterate through the roles and apply them one by one. 
        	 * so that a role which is applied later cannot override another function
        	 */
        	for(var i = 0, l = theDoesRoles.length; i < l; ++i) {
        		var role = theDoesRoles[i];
        		roles.push(role);
        		applyRoleToClass(klass, role);
            role.meta.def.does.length && applyDoes(role.meta.def.does);  
          }
        };
        applyDoes(parts);
        
        // check if all requires are fulfilled
        for(var p = 0, l = roles.length; p < l; ++p) {
        	var role = roles[p]; 
        	 for (var i in role.meta.def.requires) {
            var method = role.meta.def.requires[i];
            if (!klass.prototype[method]) {
              throw new Error("Role["+role.meta.getName()+"] requires method ["+method+"] in class ["+klass.meta.getName()+"]");
            }
          }
        }
      },
      
      helper: {
        emptyFunction: function() {}, 
        methodLoop: function(notOverride) {
          /* this need for rhino where funny things are enumerated */
          for(var i in (Joose._.Class.helper.emptyFunction)) {
            this.methodLoop = function(notOverride) {
                                         return ({
                                            "true":  function(klass, part) { for(var i in part) { !klass[i] && !(i in Joose._.Class.helper.emptyFunction) && (klass[i] = part[i]); } }, 
                                            "false": function(klass, part) { for(var i in part) { !(i in Joose._.Class.helper.emptyFunction) && (klass[i] = part[i]); } } 
                                         })[!!notOverride+''];
                              };
             return this.methodLoop(notOverride); 
          }
          this.methodLoop = function(notOverride) {
                                         return ({
                                            "true":  function(klass, part) { for(var i in part) { !klass[i] && (klass[i] = part[i]); } },
                                            "false": function(klass, part) { for(var i in part) { klass[i] = part[i]; } }
                                         })[!!notOverride+''];
                            };
          return this.methodLoop(notOverride);
        },
        
        methods: function(klass, def, notOverride) {
          var part = def;
          if (!part) { return; }
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
          };
        },
        
        before: function (func, orig) {
          return function beforeWrapper () {
            func.apply(this, arguments);
					  if (orig) { 	
						  return orig.apply(this, arguments);
					  } 
					  return null;
          };
        },
        
        after: function (func, orig) {
          return function afterWrapper () {
            var ret = orig.apply(this, arguments);
            func.apply(this, arguments);
            return ret;
          };
        },
        
        override: function (func, orig) {
          return function overrideWrapper () {
            var bound = (function(me) { return function () { return orig.apply(me, arguments); } })(this);
            var before  = this.SUPER;
            this.SUPER  = bound;
            var ret     = func.apply(this, arguments);
            this.SUPER  = before;
            return ret;
          };
        },
        aop: function(key, klass, def, name) {
          var part = def[key];
          if (!part) { return; }
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
        Joose._.Class.helper.methods(klass, def[key], notOverride);
      },
      
      methods: function(key, klass, def, notOverride) {
        Joose._.Class.helper.methods(klass.prototype, def[key], notOverride);
      },
      
      has: function(key, klass, def) {
        var part = def[key];
        if (!part) { return; }
        var js = ['var hasser =  function(klass) {'];
        var jsc = klass.meta.inits;
        for(var i in part) {
        	if(!part[i]){
        		continue;
        	}
          part[i].isPersistent = Joose._.Attribute.helper.isPersistent; // HAS to applied everytime ????
          var fname = Joose._.firstUp(i);
          js.push(Joose._.Attribute.helper.getGetterCode(fname, i, part[i]));  
          js.push(Joose._.Attribute.helper.getSetterCode(fname, i, part[i]));
          var init = part[i].init;
          jsc.keys.push(i);
          jsc.values.push(init);
        }
        js.push('}');
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
  					
  					// we also have to try if this current class and the klazz are identical
  					isClassname = new RegExp(this.className()+"$");
  					if(isClassname.exec(klazz.toString())){
  						return true;
  					} 
  					
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
  				},
          getInstanceMethods: function() {
            var a = [];
            // FIXME: This is kindof a hack to have all class methods, inherited methods and role methods listed
            for (var i in this['class'].prototype) {
              if (typeof(this['class'].prototype[i]) === 'function' && i != 'initialize' && i != 'constructor') {
                (function(name) {
                  a.push({getName: function() { return name; }});
                })(i);
              }
            }
            return a;
          },
          addMethod: function(name, fn) {
            this['class'].prototype[name] = fn;
          },
          addClassMethod: function(name, fn) {
            this['class'][name] = fn;
          }
  			}
      },
  		addMeta: function(klass) {
  			klass.toString = this._.toString;	
  			klass.meta.className = this._.meta.className;
  			klass.meta.isa = this._.meta.isa;
  			klass.meta.getInstanceMethods = this._.meta.getInstanceMethods;
  			klass.meta.addMethod = this._.meta.addMethod;
  			klass.meta.addClassMethod = this._.meta.addClassMethod;
  		},
  		addClassMeta: function() {
  		  return {
  		    classNameToClassObject: Joose._.Meta().classNameToClassObject
  		  };
  		}
    },
    Meta: function(name, type, module) {
      return {
        _name: name || { relative: '', absolute: '' },
        getName: function() { return this._name.absolute; },
        classNameToClassObject: function (className) {
            var parts  = className.split(".");
            var object = Joose._.Module.base;
            for(var i = 0, l = parts.length; i < l; ++i) {
                var part = parts[i];
                object   = object[part];
                if(!object) {
                    throw "Unable to find class "+className;
                }
            }
            return object;
        },
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
    name = current.meta._name.absolute;
    var dot = current.meta._name.absolute == '' ? '' : '.';
    for(var i = 0, len = parts.length; i < len; ++i) {
      var part = parts[i];
      name = name + dot + part;
      if (!current[part]) { 
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
      })();
    }
    return current;
  },
  Role: function(name, def) {
    if (!def) {
      def = name;
      name = Joose._.anonymousName();
    }
    return Joose.Module(name, function(current) {
		 if (!def.requires) { def.requires = []; }
		 else if (!Joose._.isArray(def.requires)) { def.requires = [def.requires]; }
		 if (!def.does) { def.does = []; }
     else if (!Joose._.isArray(def.does)) { def.does = [def.does]; }
		 current.meta.def = def;
     Joose._.Class.helper.methods(current, current.meta.def['classMethods']);
     // Note: Required by mirapodo 
     current.meta.apply = function(clazz) { Joose._.Class['does']('does', clazz.meta['class'], {'does': current}); };
	 }, 'Role');
  },
  Class: function(name, def) {
    if (!def) {
      def = name;
      name = Joose._.anonymousName();
    }
    //var klass_prototype = function() { };
    var klass = function() { 
      this.initialize && this.initialize.apply(this, arguments);
    };
    Joose.Module(name, function(current) {
		 klass.meta = current.meta;
		 klass.meta.inits = { values: [], keys: [] };
		 klass.meta.def = def;
     klass.meta.getAttributes = function() { 
       return this.def.has;
     }
		 klass.meta['class'] = klass;
		 klass.meta['c'] = klass;
     Joose._.Class.addMeta(klass);

		 for(var i in Joose._.classParser) {
			var key = Joose._.classParser[i];
			Joose._.Class[key](key, klass, def);
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
           this[key] = value.apply(this); // to set the context of the called function from joose to the actual instance 
         } else {
           this[key] = value;
         }
       }
       if (typeof(params) == 'object') {
         for (var attr in klass.meta.def.has) {
           try {
             if (typeof(params[attr]) !== 'undefined') {
               var fname = 'set'+Joose._.firstUp(attr);
               if (this[fname]) {
                 this[fname](params[attr]);
               } else if (!this[attr]) {
                 this[attr] = params[attr];
               }
             }
           } catch (e) {
             // FIXME: There are Rhino which throws exceptions on access java classes
           }
         }
       }
		 };
		 
		 if (klass.prototype.initialize) {
			klass.prototype.initialize = Joose._.Class.helper.before(inits, klass.prototype.initialize);
		 } else {
			klass.prototype.initialize = inits;
		 }
     klass.meta.instantiate = Joose._.Class.helper.instantiate;
  	 klass.prototype.meta = klass.meta;
		 current.meta.nsparent[klass.meta._name.relative] = klass;
    }, 'Class').meta;
         
    klass.apply = function(roleToExtendFrom) {
      var roles_to_apply = function(theRoles, result, i) {
        result.push.apply(result, theRoles);
        for(i = theRoles.length-1; i>= 0; --i) {
          theRoles[i].meta.def.does.length && roles_to_apply(theRoles[i].meta.def.does, result);  
        }
        return result;
      };
      roles = roles_to_apply([roleToExtendFrom], []);
      
      for(var p = roles.length - 1; p >= 0; --p) {
        var role = roles[p]; 
        // the classmethods
        for( i in role){
          if(typeof role[i] == "function"){    		  
            klass[i] = role[i];
          }
        }
        //the methods
        for( i in role.meta.def.methods){
          if(typeof role.meta.def.methods[i] == "function"){  
            klass.prototype[i] = role.meta.def.methods[i];
          }
        } 
      }
    };
    
    return klass;
  }
};

var old = Joose;

joosetop.Joose = function() {}
for(var i in old) {
	joosetop.Joose[i] = old[i];
}

joosetop.meta = Joose._.Meta(null, 'Module', joosetop);
Joose.joose = { joosetop: joosetop, top: joosetop };
joosetop.Class = Joose.Class;
joosetop.Class.meta = Joose._.Class.addClassMeta();
joosetop.Role = Joose.Role;
joosetop.Module = Joose.Module;

if (typeof exports !== 'undefined' ) {
  exports.joose = joosetop.Joose ;
}
