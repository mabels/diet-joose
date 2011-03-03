var Joose = require('./diet-joose').joose;

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
			if(this.meta.class.__instance) {
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
			if(this.__instance) {
				 return this.__instance;
			}
			this.__instance            = new this.meta.class()
			this.__instance.singletonInitialize.apply(this.__instance, arguments)
			return this.__instance;
	  }
 }
})
