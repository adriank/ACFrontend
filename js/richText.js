YUI({
	//timeout: 10000,
	//fetchCSS:false
	modules: {
		"yuirtecss": {
			fullpath: 'http://yui.yahooapis.com/combo?2.9.0/build/assets/skins/sam/skin.css',
			type: 'css'
		},
		"yuirte": {
			fullpath: 'http://yui.yahooapis.com/combo?2.9.0/build/yahoo-dom-event/yahoo-dom-event.js&2.9.0/build/container/container_core-min.js&2.9.0/build/menu/menu-min.js&2.9.0/build/element/element-min.js&2.9.0/build/button/button-min.js&2.9.0/build/editor/editor-min.js',
			requires:["yuirtecss"]
		}
	}
}).use("event","yuirte", function(Y){
	Y.on("available",function(){
		//var YAHOO = Y.YUI2;
		//Y.log(Y)
		var Dom = YAHOO.util.Dom,
		Event = YAHOO.util.Event;

		var myConfig = {
			height: '300px',
			width: '100%',
			dompath: false,
			focusAtStart: false,
			handleSubmit:true,
			markup:'xhtml',
			ptags:true
			//toolbar:{
			//	titlebar:false,
			//	//grouplabels:false,
			//	buttonType:"advanaced",
			//	buttons:[
			//		{ "id": 'b3', type: 'button', label: 'Underline', value: 'underline' },
			//		{ type: 'separator' },
			//		{ "id": 'b4', type: 'menu', label: 'Align', value: 'align',
			//			menu: [
			//				{ text: "Left", value: 'alignleft' },
			//				{ text: "Center", value: 'aligncenter' },
			//				{ text: "Right", value: 'alignright' }
			//			]
			//		}
			//	]
			//}
		};
		Y.all("form").addClass("yui-skin-sam")
		Y.each(Y.all("textarea.richText"),function(e){
			var myEditor = new YAHOO.widget.Editor(e.get("id"), myConfig);
			//myEditor._defaultToolbar.buttonType = 'basic';
			myEditor.render()
		})
	},"textarea.richText")
})
