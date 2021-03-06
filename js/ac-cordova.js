// onAvailable plugin
(function($){
  $.fn.available = function(expr,callback) {
    var evtType = 'DOMSubtreeModified';
    return this.each(function(){
      var $this = $(this),
          found = $this.find(expr)[0];
      if(found) return callback(found);

      var handler = function(e) {
        found = $this.find(expr)[0];
        if(found) {
          $this.unbind(evtType,handler);
          callback(found);
        }
      };
      $this.bind(evtType, handler);
    });
  };
})(jQuery);

function getHashParams() {
    var hashParams = {};
    var e,
        a = /\+/g,  // Regex for replacing addition symbol with a space
        r = /([^&;=]+)=?([^&;]*)/g,
        d = function (s) { return decodeURIComponent(s.replace(a, " ")); },
        q = window.location.hash.substring(2);

    while (e = r.exec(q))
       hashParams[d(e[1])] = d(e[2]);

    return hashParams;
}
var PREFIX="ac",
		locale={},
		lang=$("html").attr("lang") || "en",
		appData={x:[
								{y:[{a:1},{a:2},{a:3}]},
								{y:[{a:6},{a:7},{a:8}]}
						]},
		RE_PATH_Mustashes=/{{.+?}}/g // {{OPexpr},
		RE_PATH_Mustashes_split=/{{.+?}}/g,
		state=null


$(document).ready(function(){
	//var
	appDataOP=new objectPath(appData)

	var replaceVars=function(s){
		console.log("START: replaceVars within string:",s)
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
			result.push(e,v)
		})
		console.log("END: replaceVars with string:",result.join(""))
		return result.join("")
	}

	var template=function(n,node){
		console.log("START: template with node:",node)
		var root=appDataOP.execute($(node).attr(PREFIX+"-datasource")),
				temp=node.innerHTML.replace(/ ac-datasource=".*"/,""),
				result=[]
		//console.log(temp)
		$(root).each(function(n,o){
			//console.log(o)
			appDataOP.setCurrent(o)
			result.push(replaceVars(temp))
			//console.log("REP ",replaceVars(temp))
		})
		appDataOP.resetCurrent()
		node.innerHTML=result.join("")
		var ds=$("*["+PREFIX+"-datasource]",node)
		//ds.each(template)
		console.log("END: template",result.join(""))
	}

	var x=$.ajax({
		url:"locale/"+$("html").attr("lang")+".json",
		success:function(data){
			appData.locale=locale=data
			//updateLocales()
		},
		error:function(a,b,c,d){
			console.log("Locale file at /locale/"+$("html").attr("lang")+".json not found!")
		},
		dataType:"json",
		isLocal:true,
		async:false
	})

	var loadFragment=function(n,node){
		node=node || n
		console.log("START: each with node:",node)
		var condition=$(node).attr(PREFIX+"-condition")
		if (condition && !appDataOP.execute(condition)) {
			console.log("condition ", condition," not satisfied")
			return
		}
		var URL=$(node).attr(PREFIX+"-data")
		if (false && URL) {
			console.log("URL is:",URL)
			if (URL[URL.length]==="/") {
				URL=URL.slice(0,URL.length-1)
			}
			if (URL[0]!=="/") {
				URL="/"+URL
			}
			var path=URL.replace("/",".")
			if (path===".default") {
				path=""
			}
			if (!path || !appDataOP.execute("$"+path)) {
				$.ajax({
					url:URL+"/",
					success:function(data){
						if (!path) {
							$.extend(appData,data,true)
						}else{
							set(appData,path.slice(1,path.length),data)
						}
					},
					error:function(){
						console.log("API call to "+URL+" was not successful!")
					},
					dataType:"json",
					async:false
				})
			}
		}
		$.ajax({
			url:"fragments/"+$(node).attr(PREFIX+"-fragment")+".html",
			success:function(data){
				console.log("START: AJAX success with data:",data)
				node.innerHTML="<div class='hide'>"+data+"</div>"
				loadFragments(node)
				var nodesWithConditions=$("*["+PREFIX+"-condition]",node)
				nodesWithConditions.each(function(e){
					if (!appDataOP.execute($(this).attr(PREFIX+"-condition"))) {
						console.log("condition",$(this).attr(PREFIX+"-condition"),"not satisfied")
						//console.log(!appDataOP.execute($(this).attr(PREFIX+"-condition")))
						$(this).remove()
					}else{
						console.log("condition",$(this).attr(PREFIX+"-condition"),"satisfied")
					}
				})
				var ds=$(":not(*["+PREFIX+"-datasource]) *["+PREFIX+"-datasource]",node)
				console.log("DS!",ds)
				// This is slow - a proff of concept only!
				if(ds.length){
					console.log("datasource found!")
					ds.each(template)
				}
				node.innerHTML=replaceVars($(node).children().html())
				console.log("END: AJAX success")
			},
			error:function(){
				console.log("Fragment file at /fragments/"+$(node).attr(PREFIX+"-fragment")+".html not found!")
			},
			async:false,
			isLocal:true,
			dataType:"html"
		})
		console.log("END: each")
	}

	var loadFragments=function(context){
		console.log("START: loadFragments with context",context)
		// HTML fragments PJAX
		console.log("fragments found:",$("*["+PREFIX+"-fragment]",context))
		$("*["+PREFIX+"-fragment]",context).each(loadFragment)
		console.log("END: fragments")
	}
	loadFragments(document)

	state=getHashParams()
	var refreshState=function(){
		if (state.main) {
			$("#main").attr(PREFIX+"-fragment",state.main)
								.attr(PREFIX+"-data",state.data)
			loadFragment($("#main")[0])
		}
	}
	refreshState()
	//window.onhashchange=refreshState

	$("body").on("click","a["+PREFIX+"-target]",function(e){
		e.preventDefault()
		var targetEl=$(e.currentTarget).attr(PREFIX+"-target"),
				href=$(e.currentTarget).attr("href"),
				currFragment=$(targetEl).attr(PREFIX+"-fragment"),
				condition=$(e.currentTarget).attr(PREFIX+"-condition")
		if (condition && !appDataOP.execute(condition)) {
			console.log("condition "+condition+" not satisfied")
			return
		}
		console.log("condition "+condition+" satisfied")
		if (href[0]==="/") {
			href=href.slice(1,href.length)
		}
		console.log("href is",href)
		if (currFragment!==href) {
			console.log("currFragment",targetEl)
			var t=$(targetEl)
			if (!t[0]) {
				console.error("Target element "+targetEl+" not found!")
				return
			}
			t.attr(PREFIX+"-fragment",href)
			t.attr(PREFIX+"-data",$(e.currentTarget).attr(PREFIX+"-data") || "")
			loadFragment(t[0])
			window.location.hash="#!main="+href+"&data="+t.attr(PREFIX+"-data")
		}
		console.log(e.currentTarget,targetEl,href)
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
