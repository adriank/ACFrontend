YUI({
	//filter:"DEBUG",
	timeout: 10000,
	fetchCSS:false
}).use("base","event", function(Y){
	Y.on('available', function(){
		YUI({fetchCSS:false}).use("node-menunav",function(YY){
			YY.all(".acenv-menu").each(function(e){
				e.plug(YY.Plugin.NodeMenuNav,{autoSubmenuDisplay:true, submenuShowDelay:0, mouseOutHideDelay:1000})
			})
		})
	}, "div.acenv-menu")

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
})
