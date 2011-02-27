var util = require('util');

Joose = (function() {
  var classParser = ['isa', 'classMethods', 'methods', 'has', 'does', 'before', 'after', 'around', 'override'];
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
            for(var i in classParser.slice(1)/*skip isa*/) {
              var key = classParser[i];
              Joose._.Class[key](name, key, klass, role)
            }
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
            if (init) {
              jsc.keys.push(i) 
              jsc.values.push(init)
            }
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
      var klass = function() { 
        this.initialize && this.initialize(arguments);

      };
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
      var inits = function() {
        for(var i in klass.meta.inits.keys) {
          var key = klass.meta.inits.keys[i];
          var value = klass.meta.inits.values[i];
          if (typeof(value) == 'function') {
            this[key] = value();
          } else {
            this[key] = value;
          }
        }
      }
      if (klass.prototype.initialize) {
        klass.prototype.initialize = Joose._.Class.helper.before(inits, klass.prototype.initialize);
      } else {
        klass.prototype.initialize = inits;
      }
      klass.prototype = klass.prototype || {}
      klass.prototype.meta = klass.meta;
      Joose._.Module.current[name] = klass;
      return klass;
    }
  }
  for (var i in Joose) {
    Joose._.Module.base[i] = Joose[i]
  }
  return Joose._.Module.base;
})();
