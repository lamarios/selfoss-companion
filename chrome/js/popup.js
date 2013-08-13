var expression = /[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/gi;
var regex = new RegExp(expression);
var backgroundPage = chrome.extension.getBackgroundPage();

$(document).ready(function(){	
	$("#visitSite").click(visitSite);
	
	chrome.storage.local.get('url', function(data) {
    	if (data.url && data.url.match(regex)){
	       $("#iframe").attr("src", data.url);
    	}else{
    		chrome.browserAction.setBadgeText({text: "!"});
    		visitSite();
    	}
    });
});

function visitSite(){
	chrome.extension.sendMessage({message: "visitSite"});
}

addEventListener("unload", function (event) {
	backgroundPage.checkUnread();
}, true);
