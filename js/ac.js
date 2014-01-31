var count=0
document.write=function(t){
	console.log(scriptid)
	var script=$("*[id="+scriptid+"]")
	console.log(script)
	script.after(t)
	console.log(count++)
}

var log=function() {
	try {
		// this works in Firefox/Opera
		console.log.apply( this, arguments );
	} catch (e) {
		// this is for Chrome/IE
		var args = [], i = 0;
		while( i++ < arguments.length )
			args.push('arg' + i);

		new Function( args, 'console.log(' + args.join( ',' ) + ')' ).
		apply(null, arguments);
	}
}

function getHashParams() {
    var hashParams = {};
    var e,
        a = /\+/g,  // Regex for replacing addition symbol with a space
        r = /([^&;=]+)=?([^&;]*)/g,
        d = function (s) { return decodeURIComponent(s.replace(a, " ")); },
        q = window.location.hash.substring(2)

    while (e = r.exec(q))
       hashParams[d(e[1])] = d(e[2]);

    return hashParams;
}

function fixScriptTags(node) {
	console.log("START fixScriptTags with ",node)
	$(node).find("script").each(function(n){
		if ($(this).attr("id")) {
			return
		}
		var id="js"+$.now()
		$(this).attr("id",id)
		this.innerHTML="scriptid=\""+id+"\";\n"+this.innerHTML
		console.log(this)
	})
}

var PREFIX="ac",
		locale={},
		lang=$("html").attr("lang") || "en",
		appData={},
		RE_PATH_Mustashes=/{{.+?}}/g // {{OPexpr},
		RE_PATH_Mustashes_split=/{{.+?}}/g,
		state=null,
		scriptid=null

$(document).ready(function(){
	//var
	appDataOP=new objectPath(appData)

	//state=$.parseJSON(hash.substring(2,hash.length))
	//var updateState=function(state){
	//}

	var replaceVars=function(s){
		//log("START: replaceVars within string:",s)
		s=s.replace(/<!--[\s\S]*?-->/g, "")
		var variables=s.match(RE_PATH_Mustashes)
		if (!variables) {
			return s
		}
		var splitted=s.split(RE_PATH_Mustashes_split),
				result=[]
		//log(splitted.length)
		//log(variables.length)
		$.each(splitted,function(n,e){
			//log(variables.length,variables[0])
			var v=variables.length?appDataOP.execute(variables.shift().slice(2,-2)) : ""
			//log(appData)
			//log(v)
			result.push(e,v)
		})
		//log("END: replaceVars with string:",result.join(""))
		return result.join("")
	}

	var template=function(n,node){
		//log("START: template with node:",node)
		var root=appDataOP.execute($(node).attr(PREFIX+"-datasource")),
				temp=node.innerHTML.replace(/ ac-datasource=".*"/,""),
				result=[]
		//log(temp)
		$(root).each(function(n,o){
			//log(o)
			appDataOP.setCurrent(o)
			result.push(replaceVars(temp))
			//log("REP ",replaceVars(temp))
		})
		appDataOP.resetCurrent()
		node.innerHTML=result.join("")
		//log("END: template",result.join(""))
	}

	var x=$.ajax({
		url:"/locale/"+$("html").attr("lang")+".json",
		success:function(data){
			appData.locale=locale=data
			//updateLocales()
		},
		error:function(a,b,c,d){
			console.error("Locale file at /locale/"+$("html").attr("lang")+".json not found!")
		},
		dataType:"json",
		async:false
	})

	var loadFragment=function(n,node){
		node=node || n
		//log("START: each with node:",node)
		var condition=$(node).attr(PREFIX+"-condition")
		if (condition && !appDataOP.execute(condition)) {
			console.warning("condition ", condition," not satisfied")
			return
		}
		var URL=$(node).attr(PREFIX+"-data")
		if (URL) {
			//log("URL is:",URL)
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
						console.error("API call to "+URL+" was not successful!")
					},
					dataType:"json",
					async:false
				})
			}
		}
		$.ajax({
			url:"/fragments/"+$(node).attr(PREFIX+"-fragment")+".html",
			success:function(data){
				//log("START: AJAX success with data:",data)
				node.innerHTML="<div class='hide'><script> </script>"+data+"</div>"
				fixScriptTags($(node))
				loadFragments(node)
				var nodesWithConditions=$("*["+PREFIX+"-condition]",node)
				nodesWithConditions.each(function(e){
					if (!appDataOP.execute($(this).attr(PREFIX+"-condition"))) {
						console.warning("condition",$(this).attr(PREFIX+"-condition"),"not satisfied")
						//log(!appDataOP.execute($(this).attr(PREFIX+"-condition")))
						$(this).remove()
					}else{
						console.info("condition",$(this).attr(PREFIX+"-condition"),"satisfied")
					}
				})
				var ds=$("*["+PREFIX+"-datasource]",node)
				// This is slow - a proff of concept only!
				if(ds.length){
					//log("datasource found!")
					ds.each(template)
				}
				// IDK how (or if) append is slower than append but innerHTML doesn't execute embedded scripts
				//node.innerHTML=replaceVars($(node).children().html())
				//alert(replaceVars($(node).children().html()))
				var help=replaceVars($(node).children().html())
				$(node).empty("*")
				$(node).append(help)
				//log("END: AJAX success")
			},
			error:function(){
				console.error("Fragment file at /fragments/"+$("html").attr("lang")+"not found!")
			},
			async:false,
			dataType:"text"
		})
		//log("END: each")
	}

	var loadFragments=function(context){
		//log("START: loadFragments with context",context)
		// HTML fragments PJAX
		//log("fragments found:",$("*["+PREFIX+"-fragment]",context))
		$("*["+PREFIX+"-fragment]",context).each(loadFragment)
		//log("END: fragments")
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
			console.warning("condition "+condition+" not satisfied")
			return
		}
		console.info("condition "+condition+" satisfied")
		if (href[0]==="/") {
			href=href.slice(1,href.length)
		}
		//log("href is",href)
		if (currFragment!==href) {
			//log("currFragment",targetEl)
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
		//log(e.currentTarget,targetEl,href)
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
