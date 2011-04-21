Class("Joose.TypeChecker", {
  classMethods: {
    install: function() {
      var oldFn = Joose._.Attribute.helper.getSetterCode;
      Joose._.Attribute.helper.getSetterCode = function(fname, name, props) {
        if (props.isa) {
          var type = props.isa.meta.getName();
          var code = [];
          code.push('klass["set'+fname+'"] = function(val) {');
          code.push('if (!' + type + '.where(val)) { ');
          if (props.coerce) {
            code.push('val = ' + type + '.coerce(val); '); 
            code.push('if (!' + type + '.where(val)) { ');
            code.push('throw new Error(val + " not of type ' + type + '");');
            code.push('}');
          } else {
            code.push('throw new Error(val + " not of type ' + type + '");');
          }
          code.push('}');
          code.push('this["'+name+'"] = val; return this; '); 
          code.push('};');
          return code.join('');
        }
        return oldFn(fname, name, props);
      };
    }
  }
});

Class('Joose.Type.Null', {
  classMethods: {
    where: function(value) { return value === null; }
  }
});

Class('Joose.Type.Obj', {
  classMethods: {
    where: function(value) { return value != null && value instanceof Object; },
  }
});

Class('Joose.Type.Str', {
  classMethods: {
    where: function(value) { return value != null && (typeof(value) === 'string' || value instanceof String); },
    coerce: function (value) { return "" + value; }
  }
});

Class('Joose.Type.Num', {
  classMethods: {
    where: function(N) { return N != null && (typeof(N) == 'number' || N instanceof Number); },
    coerce: function (value) { return parseFloat(value, 10); }
  }
});

Joose.TypeChecker.install();
TYPE = Joose.Type;
