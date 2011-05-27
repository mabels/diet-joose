//require('./diet-joose');

/**
* Joose.Singleton
* Role for singleton classes.
* Gives a getInstance class method to classes using this role.
* The getInstance method will create a method on first invocation and return the same instance
* upon every consecutive invocation.
*/
Role("Joose.Singleton", {
 before: {
	  initialize: function () {
			if(Joose._.singletonlock && this.meta['class'].__instance) {
				 throw new Error("The class "+this.meta.className()+" is a singleton. Please use the class method getInstance().")
			}
	  }
 },
 
 methods: {
		singletonInitialize: function () {
			 
		}
 },
 
 classMethods: {
	  getInstance: function () {
	    var registry = (Joose.Singleton.registry || (Joose.Singleton.registry = {}))
	    var name = this.meta.getName();
      if (registry[name]) {
				 return registry[name];
			}
      Joose._.singletonlock = false;
      registry[name] = this.meta.instantiate();
      Joose._.singletonlock = true;
			registry[name].singletonInitialize.apply(registry[name], arguments)
			return registry[name];
	  }
 }
});
Joose._.singletonlock = true;
