// onAvailable from https://github.com/furf/jquery-onavailable
(function(A){A.extend({onAvailable:function(C,F){if(typeof F!=="function"){throw new TypeError();}var E=A.onAvailable;if(!(C instanceof Array)){C=[C];}for(var B=0,D=C.length;B<D;++B){E.listeners.push({id:C[B],callback:F,obj:arguments[2],override:arguments[3],checkContent:!!arguments[4]});}if(!E.interval){E.interval=window.setInterval(E.checkAvailable,E.POLL_INTERVAL);}return this;},onContentReady:function(C,E,D,B){A.onAvailable(C,E,D,B,true);}});A.extend(A.onAvailable,{POLL_RETRIES:2000,POLL_INTERVAL:20,interval:null,listeners:[],executeCallback:function(C,D){var B=C;if(D.override){if(D.override===true){B=D.obj;}else{B=D.override;}}D.callback.call(B,D.obj);},checkAvailable:function(){var F=A.onAvailable;var D=F.listeners;for(var B=0;B<D.length;++B){var E=D[B];var C=$(E.id);if(C[0]&&(!E.checkContent||(E.checkContent&&(C.nextSibling||C.parentNode.nextSibling||A.isReady)))){F.executeCallback(C,E);D.splice(B,1);--B;}if(D.length===0||--F.POLL_RETRIES===0){F.interval=window.clearInterval(F.interval);}}}});})(jQuery);

var PREFIX="ac",
		locale={},
		lang=$("html").attr("lang") || "en",
		appData={},
		appDataOP=new ObjectPath(appData),
		RE_PATH_Mustashes=/{{.+?}}/g // {{OPexpr},
		RE_PATH_Mustashes_split=/{{.+?}}/g,
		D=DEBUG=false

//D=true

var ac={
	"components":{},
	"triggers":[]
}

ac.delMustashes=function(s){
	if (!s) {
		return s
	}
	if (s.slice(0,2)==="{{") {
		return path.slice(2,-3)
	}
	return s
}

ac.onAvailable=function(selector,fn){
	ac.triggers.push({"selector":selector,"fn":fn})
	$.onAvailable(selector,fn)
}

ac.trigger=function(){
	$.each(ac.triggers, function(el){
		$.onAvailable(this.selector, this.fn)
	})
}

ac.fixFragmentURL=function(URL){
	if (URL.slice(-6,-1)!==".html") {
		URL+=".html"
	}
	if (URL[0]!=="/") {
		URL="/"+URL
	}
	if (URL.slice(0,10)!=="/fragments") {
		URL="/fragments"+URL
	}
	return URL
}

ac.fixAPIURL=function(URL){
	if (URL.slice(-1)!=="/") {
		URL=URL+"/"
	}
	if (URL[0]!=="/") {
		URL="/"+URL
	}
	if (URL.slice(0,4)!=="/api") {
		URL="/api"+URL
	}
	return URL
}

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
		if (D) console.log(this.params)
		window.location.hash=this.makeHash()
	}
}

var locationHash=new hashWorker()

var addSpinner=function(el){
	el.attr("title","Waiting for response")
	el.find(".ac-spin").remove()
	el.append(" <i class='fa fa-spinner fa-spin ac-spin'></i>")
}

var removeSpinner=function(el){
	el.removeAttr("title")
	var spinner=el.find(".fa-spin")
	spinner.removeClass("fa-spinner fa-spin")
				 .addClass("fa-check")
				 .addClass("hide-delay")
	setTimeout(function(){spinner.remove()},1200)
}

var errorSpinner=function(el, err){
	el.attr("title","Error! "+err)
	var spinner=el.find(".fa-spin")
	spinner.removeClass("fa-spinner fa-spin")
				 .addClass("fa-warning")
		//.addClass("hide-delay")
	//setTimeout(function(){spinner.remove()},1200)
}

$(document).ready(function(){
	var	lang=$("html").attr("lang") || "en"

	var loadFragment=function(n,node){
		node=node || n
		if (D) console.log("START: each with node:",node)
		var condition=ac.delMustashes($(node).attr(PREFIX+"-condition"))
		if (condition && !appDataOP.execute(condition)) {
			console.log("condition ", condition," not satisfied")
			return
		}
		var URL=$(node).attr(PREFIX+"-dataSource"),
				curr=false
		if (URL) {
			URL=ac.fixAPIURL(replaceVars(URL))
			if (D) console.log("URL is:",URL)
			var path=URL.slice(4,URL.length-1).replace(/\//g,".")
			if (path===".default") {
				path=""
			}
			if (D) console.log("path", path)
			// TODO bring back this optimization
			if (true || !path || !appDataOP.execute("$"+path.replace(/\./g,"'.'").slice(1)+"'")) {
				var conf={
					url:URL,
					success:function(data){
						if (!path) {
							$.extend(appData,data,true)
						}else{
							set(appData,path.slice(1,path.length),data)
							curr=data
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

		if ($(node).attr(PREFIX+"-fragment")) {
			$.ajax({
				url:ac.fixFragmentURL(replaceVars($(node).attr(PREFIX+"-fragment"))),
				success:function(data){
					appDataOP.setContext(curr)
					appDataOP.setCurrent(curr)
					if (D) console.log("START: AJAX success with data:",data)
					node.innerHTML="<div class='hide'>"+data+"</div>"
					if (D) console.log("NODE",node)
					loadFragments(node)
					var dp=$(":not(*["+PREFIX+"-datapath]) *["+PREFIX+"-datapath]",node)
					// This is slow - a proff of concept only!
					if(dp.length){
						if (D) console.log("dataPath found!",dp)
						dp.each(template)
						dp.removeAttr(PREFIX+"-datapath")
					}
					node.innerHTML=replaceVars($(node).children().html())
					var nodesWithConditions=$("*["+PREFIX+"-condition]",node)
					nodesWithConditions.each(function(e){
						if (!appDataOP.execute($(this).attr(PREFIX+"-condition"))) {
							//console.log("DATA",appDataOP.current)
							if (D) console.log("condition",ac.delMustashes($(this).attr(PREFIX+"-condition")),"not satisfied")
							//console.log(!appDataOP.execute($(this).attr(PREFIX+"-condition")))
							$(this).remove()
						}else{
							if (D) console.log("condition",ac.delMustashes($(this).attr(PREFIX+"-condition")),"satisfied")
						}
					})
					if (D) console.log("END: AJAX success")
				},
				error:function(){
					if (D) console.error("Fragment file at /fragments/"+$("html").attr("lang")+"not found!")
				},
				async:false,
				dataType:"html"
			})
		}
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
		var root=appDataOP.execute(ac.delMustashes($(node).attr(PREFIX+"-datapath"))),
			temp=node.innerHTML.replace(/ ac-datapath=".*"/,""),
			result=[]
		var cache=appDataOP.current
		$(root).each(function(n,o){
			appDataOP.setCurrent(o)
			//console.log("DATA", o)
			$("body").append("<span id='ac-helper' class='hide'></span>")
			var node=$("#ac-helper")
			node[0].innerHTML=replaceVars(temp)
			var nodesWithConditions=node.find("*["+PREFIX+"-condition]")
			if (D) console.log("nodesWithConditions", node)
			nodesWithConditions.each(function(e){
				var con=ac.delMustashes($(this).attr(PREFIX+"-condition"))
				if (!appDataOP.execute(con)) {
					if (D) console.log("condition",con,"not satisfied")
					$(this).remove()
				}else{
					$(this).removeAttr(PREFIX+"-condition")
					if (D) console.log("condition",con,"satisfied")
				}
			})
			//console.log(node[0].innerHTML)
			result.push(node[0].innerHTML)
			node.remove()
			//console.log("REP ",replaceVars(temp))
		})
		appDataOP.setCurrent(cache)
		node.innerHTML=result.join("")
		if (D) console.log("END: template", result.join(""))
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

	$("body").on("click","a, button",function(e){
		var href=$(e.currentTarget).attr("href")
		if (href && href[0]==="#") {
			e.preventDefault()
			return
		}
		if (!$(e.currentTarget).attr(PREFIX+"-target")) {
			return
		}
		e.preventDefault()
		var currentTarget=$(e.currentTarget)
				targetSelector=currentTarget.attr(PREFIX+"-target"),
				href=currentTarget.attr("href"),
				currFragment=$(targetSelector).attr(PREFIX+"-fragment"),
				condition=ac.delMustashes(currentTarget.attr(PREFIX+"-condition"))

		currentTarget.parents(".nav").find("*[ac-target="+targetSelector+"].active").removeClass("active")
		currentTarget.addClass("active")
		addSpinner(currentTarget)

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
			if (D) console.log("currFragment",targetSelector)
			var t=$(targetSelector)
			if (!t[0]) {
				console.error("Target element "+targetSelector+" not found!")
				return
			}
			t.attr(PREFIX+"-fragment",href)
			t.attr(PREFIX+"-dataSource",currentTarget.attr(PREFIX+"-dataSource") || "")
			loadFragment(t[0])
			ac.trigger()
			removeSpinner(currentTarget)
			var target=targetSelector.slice(1)
			var d={}
			d[target]=href
			d[target+"_ds"]=t.attr(PREFIX+"-dataSource")
			locationHash.update(d)
		}
		if (D) console.log(e.currentTarget,targetSelector,href)
	})


	// TODO, optimization: check if $("body").on("submit","form",...) works
	$.onAvailable("form", function(){
		this.attr("method","POST")
		this.attr("enctype","multipart/form-data")
	})

	$("body").on("submit", "form", function(e){
		e.preventDefault()
		var self=$(this)
		var targetEl=self.attr(PREFIX+"-target"),
				href=self.attr("href"),
				currFragment=$(targetEl).attr(PREFIX+"-fragment"),
				condition=ac.delMustashes(self.attr(PREFIX+"-condition"))

		if (!targetEl) {
			var btn=$(e.originalEvent.explicitOriginalTarget)
			addSpinner(btn)
			$.ajax({
				url: "/api"+self.attr("action"),
				data: self.serialize(),
				success: function(e) {
					removeSpinner(btn)
					var r=self.attr(PREFIX+"-redirect")
					if (r) {
						window.location=r
					}
				},
				error:function(e, status, error){
					console.log(error)
					try{
						errorSpinner(btn, e.responseJSON.GlobalError.message)
					}catch(TypeError){
						errorSpinner(btn, error || "Server not responding.")
					}
				},
				type:"POST"
			})
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
			ac.trigger()
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
