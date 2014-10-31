// onAvailable from https://github.com/furf/jquery-onavailable
(function(A){A.extend({onAvailable:function(C,F){if(typeof F!=="function"){throw new TypeError();}var E=A.onAvailable;if(!(C instanceof Array)){C=[C];}for(var B=0,D=C.length;B<D;++B){E.listeners.push({id:C[B],callback:F,obj:arguments[2],override:arguments[3],checkContent:!!arguments[4]});}if(!E.interval){E.interval=window.setInterval(E.checkAvailable,E.POLL_INTERVAL);}return this;},onContentReady:function(C,E,D,B){A.onAvailable(C,E,D,B,true);}});A.extend(A.onAvailable,{POLL_RETRIES:2000,POLL_INTERVAL:20,interval:null,listeners:[],executeCallback:function(C,D){var B=C;if(D.override){if(D.override===true){B=D.obj;}else{B=D.override;}}D.callback.call(B,D.obj);},checkAvailable:function(){var F=A.onAvailable;var D=F.listeners;for(var B=0;B<D.length;++B){var E=D[B];var C=$(E.id);if(C[0]&&(!E.checkContent||(E.checkContent&&(C.nextSibling||C.parentNode.nextSibling||A.isReady)))){F.executeCallback(C,E);D.splice(B,1);--B;}if(D.length===0||--F.POLL_RETRIES===0){F.interval=window.clearInterval(F.interval);}}}});})(jQuery);

var PREFIX="ac",
		locale={},
		lang=$("html").attr("lang") || "en",
		appData={},
		appDataOP=new objectPath(appData),
		RE_PATH_Mustashes=/{{.+?}}/g // {{OPexpr},
		RE_PATH_Mustashes_split=/{{.+?}}/g,
		D=DEBUG=false

D=true

var replaceVars=function(s){
	//console.log("START: replaceVars within string:",s)
	s=s.replace(/<!--[\s\S]*?-->/g, "")
	var variables=s.match(RE_PATH_Mustashes)
	if (!variables) {
		return s
	}
	var splitted=s.split(RE_PATH_Mustashes_split),
			result=[]
	//console.log(splitted.length)
	//console.log(variables.length)
	$.each(splitted,function(n,e){
		//console.log(variables.length,variables[0])
		var v=variables.length?appDataOP.execute(variables.shift().slice(2,-2)) : ""
		//console.log(appData)
		//console.log(v)
		if (v instanceof Object) {
			v=JSON.stringify(v, null, 2)
		}
		result.push(e, v)
	})
	//console.log("END: replaceVars with string:",result.join(""))
	return result.join("")
}

var hashWorker=function(){
	this.params={}
	this.get()
}

hashWorker.prototype={
	get:function(){
		var hashParams = {};
		var e,
				a = /\+/g,  // Regex for replacing addition symbol with a space
				r = /([^&;=]+)=?([^&;]*)/g,
				d = function (s) { return decodeURIComponent(s.replace(a, " ")); },
				q = window.location.hash.substring(2);

		while (e = r.exec(q))
			hashParams[d(e[1])] = d(e[2]);

		this.params=hashParams
		return hashParams
	},
	makeHash:function(){
		var h=[]
		$.each(this.params, function(k,o){
			h.push(k+"="+o)
		})
		return "#!"+h.join("&")
	},
	update:function(o){
		var self=this
		$.each(o, function(k,o){
			self.params[k]=o
		})
		//if (D)
		console.log(this.params)
		window.location.hash=this.makeHash()
	}
}

var locationHash=new hashWorker()

$(document).ready(function(){
	var	lang=$("html").attr("lang") || "en"

	var loadFragment=function(n,node){
		node=node || n
		if (D) console.log("START: each with node:",node)
		var condition=$(node).attr(PREFIX+"-condition")
		if (condition && !appDataOP.execute(condition)) {
			console.log("condition ", condition," not satisfied")
			return
		}
		var URL=$(node).attr(PREFIX+"-dataSource")
		if (URL) {
			if (D) console.log("URL is:",URL)
			if (URL[URL.length]==="/") {
				URL=URL.slice(0,URL.length-1)
			}
			if (URL[0]!=="/") {
				URL="/"+URL
			}
			var path=URL.replace(/\//g,".")
			if (path===".default") {
				path=""
			}
			if (D) console.log("path", path)
			// TODO bring back this optimization
			if (true || !path || !appDataOP.execute("$"+path.replace(/\./g,"'.'").slice(1)+"'")) {
				var conf={
					url:"/api/"+URL+"/",
					success:function(data){
						if (!path) {
							$.extend(appData,data,true)
						}else{
							set(appData,path.slice(1,path.length),data)
							appDataOP.setContext(data)
							appDataOP.setCurrent(data)
						}
					},
					error:function(){
						console.error("API call to "+URL+" was not successful!")
					},
					dataType:"json",
					async:false
				}
				var post=$(node).attr(PREFIX+"-post")
				if (post) {
					conf["type"]="POST"
					conf["data"]=post
				}
				$.ajax(conf)
			}
		}
		$.ajax({
			url:"/fragments/"+$(node).attr(PREFIX+"-fragment")+".html",
			success:function(data){
				if (D) console.log("START: AJAX success with data:",data)
				node.innerHTML="<div class='hide'>"+data+"</div>"
				loadFragments(node)
				var nodesWithConditions=$("*["+PREFIX+"-condition]",node)
				nodesWithConditions.each(function(e){
					if (!appDataOP.execute($(this).attr(PREFIX+"-condition"))) {
						if (D) console.log("condition",$(this).attr(PREFIX+"-condition"),"not satisfied")
						//console.log(!appDataOP.execute($(this).attr(PREFIX+"-condition")))
						$(this).remove()
					}else{
						if (D) console.log("condition",$(this).attr(PREFIX+"-condition"),"satisfied")
					}
				})
				var ds=$(":not(*["+PREFIX+"-datapath]) *["+PREFIX+"-datapath]",node)
				if (D) console.log("DS!",ds)
				// This is slow - a proff of concept only!
				if(ds.length){
					if (D) console.log("datasource found!")
					ds.each(template)
				}
				node.innerHTML=replaceVars($(node).children().html())
				if (D) console.log("END: AJAX success")
			},
			error:function(){
				if (D) console.error("Fragment file at /fragments/"+$("html").attr("lang")+"not found!")
			},
			async:false,
			dataType:"html"
		})
		if (D) console.log("END: each")
	}

	var loadFragments=function(context){
		if (D) console.log("START: loadFragments with context",context)
		// HTML fragments PJAX
		if (D) console.log("fragments found:",$("*["+PREFIX+"-fragment]",context))
		$("*["+PREFIX+"-fragment]",context).each(loadFragment)
		if (D) console.log("END: fragments")
	}

	var template=function(n,node){
		if (D) console.log("START: template with node:",node)
		var root=appDataOP.execute($(node).attr(PREFIX+"-datapath")),
			temp=node.innerHTML.replace(/ ac-datapath=".*"/,""),
			result=[]
		//console.log(root)
		var cache=appDataOP.current
		$(root).each(function(n,o){
			appDataOP.setCurrent(o)
			result.push(replaceVars(temp))
			//console.log("REP ",replaceVars(temp))
		})
		appDataOP.setCurrent(cache)
		//appDataOP.resetCurrent()
		node.innerHTML=result.join("")
		var ds=$("*["+PREFIX+"-datapath]",node)
		//ds.each(template)
		if (D) console.log("END: template",result.join(""))
	}

	var x=$.ajax({
		url:"/locale/"+$("html").attr("lang")+".json",
		success:function(data){
			appData.locale=locale=data
			//updateLocales()
		},
		error:function(e,b,c,d){
			console.error("Problem with Locale file at /locale/"+$("html").attr("lang")+".json\n", c)
		},
		dataType:"json",
		async:false
	})

	loadFragments(document)

	//if (D) console.log("hash state", state)

	var refreshState=function(){
		var state=locationHash.params
		$.each(state, function(k,o){
			if (k.indexOf("_ds")!==-1) {
				return
			}
			$("#"+k).attr(PREFIX+"-fragment",state[k])
							.attr(PREFIX+"-dataSource",state[k+"_ds"])
			loadFragment($("#"+k)[0])
		})
	}

	//var r=locationHash.
	refreshState()

	//window.onhashchange=refreshState
	alert(PREFIX)

	$("body").on("click","a["+PREFIX+"-target]",function(e){
		e.preventDefault()
		var targetEl=$(e.currentTarget).attr(PREFIX+"-target"),
				href=$(e.currentTarget).attr("href"),
				currFragment=$(targetEl).attr(PREFIX+"-fragment"),
				condition=$(e.currentTarget).attr(PREFIX+"-condition")
		$("*[ac-target="+targetEl+"]").removeClass("active")
		$(e.currentTarget).addClass("active")
		if (condition && !appDataOP.execute(condition)) {
			if (D) console.log("condition "+condition+" not satisfied")
			return
		}
		if (D) console.log("condition "+condition+" satisfied")
		if (href[0]==="/") {
			href=href.slice(1)
		}
		if (D) console.log("href is",href)
		// TODO bring back this optimization
		if (true || currFragment!==href) {
			if (D) console.log("currFragment",targetEl)
			var t=$(targetEl)
			if (!t[0]) {
				console.error("Target element "+targetEl+" not found!")
				return
			}
			t.attr(PREFIX+"-fragment",href)
			t.attr(PREFIX+"-dataSource",$(e.currentTarget).attr(PREFIX+"-dataSource") || "")
			loadFragment(t[0])
			var target=targetEl.slice(1)
			var d={}
			d[target]=href
			d[target+"_ds"]=t.attr(PREFIX+"-dataSource")
			locationHash.update(d)
		}
		if (D) console.log(e.currentTarget,targetEl,href)
	})


	// TODO, optimization: check if $("body").on("submit","form",...) works
	$.onAvailable("form", function(){
		this.attr("method","POST")
		this.attr("enctype","multipart/form-data")
	})

	//$("body").on("submit", "form", function(e){
	//	e.preventDefault()
	//})

	//$("body").on("submit", "form["+PREFIX+"-target]", function(e){
	$("body").on("submit", "form", function(e){
		e.preventDefault()
		var self=$(this)
		var targetEl=self.attr(PREFIX+"-target"),
				href=self.attr("href"),
				currFragment=$(targetEl).attr(PREFIX+"-fragment"),
				condition=self.attr(PREFIX+"-condition")

		if (!targetEl) {
			$.post()(
				self.attr("action"),
				self.serialize(),
				function(e) {
					console.log(e)
				}
			)
			return
		}

		if (condition && !appDataOP.execute(condition)) {
			if (D) console.log("condition "+condition+" not satisfied")
			return
		}
		if (D) console.log("condition "+condition+" satisfied")

		if (href[0]==="/") {
			href=href.slice(1)
		}
		if (D) console.log("href is",href)
		if (true || currFragment!==href) {
			if (D) console.log("currFragment",targetEl)
			var t=$(targetEl)
			if (!t[0]) {
				console.error("Target element "+targetEl+" not found!")
				return
			}
			t.attr(PREFIX+"-fragment",href)
			t.attr(PREFIX+"-dataSource",self.attr("action"))
			t.attr(PREFIX+"-post",self.serialize())
			loadFragment(t[0])
			var target=targetEl.slice(1)
			var d={}
			d[target]=href
			d[target+"_ds"]=self.attr("action")
			locationHash.update(d)
		}
	})
})

var set=function(o,path,val) {
	var splitted=path.split('.');
	for (var i=0;i<splitted.length-1;i++) {
		var x=splitted[i];
		o[x]=o[x]||{};
		o=o[x];
	}
	o[splitted.pop()]=val;
}
