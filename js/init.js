YUI({
	//filter:"DEBUG",
	timeout: 10000,
	fetchCSS:false
}).use("base",
	function(Y){
		Y.on('available', function(){
			YUI({fetchCSS:false}).use("node-menunav",function(){
				var menu=Y.all(".acenv-menu")
				menu.plug(Y.Plugin.NodeMenuNav,{autoSubmenuDisplay:true, submenuShowDelay:0, mouseOutHideDelay:1000})
			})
		}, ".acenv-menu")

		Y.on('available', function(){
			Y.Get.css(["http://e.acimg.eu/sh2/sh_style.min.css"])
			Y.Get.script([
				"http://e.acimg.eu/sh2/sh_main.min.js",
				"http://e.acimg.eu/sh2/sh_xml.js"
			], {
				onSuccess: function(){
					Y.all(".sh_xml").addClass("sh_sourceCode")
					sh_highlightDocument()}
			});
		}, ".sh_xml")
	}
)
