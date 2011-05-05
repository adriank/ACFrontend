YUI.add("focusplugin", function(Y){
	function FocusPlugin(config){
		FocusPlugin.superclass.constructor.apply(this, arguments)
	}

	FocusPlugin.NAME="focusPlugin"
	FocusPlugin.NS="FP"

	Y.extend(FocusPlugin, Y.Plugin.Base, {
		initializer:function(){
			var host=this.get("host")
			this.fieldContent=host.get("defaultValue")
			host.set("value",this.fieldContent)
			this.afterHostEvent('focus', this.onFocus)
			this.afterHostEvent('blur', this.onBlur)
		},
		onFocus:function(){
			var host=this.get("host"),
				value=host.get("value")
			if (value==this.fieldContent)
				host.set("value","")
		},
		onBlur:function(){
			var host=this.get("host")
			if (host.get("value")=="")
				host.set("value",this.fieldContent)
		}
	})
	Y.FocusPlugin=FocusPlugin
}, "3.1.1", {requires:["plugin"]})
