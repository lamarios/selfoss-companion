var expression = /[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/gi;
var regex = new RegExp(expression);
var backgroundPage = chrome.extension.getBackgroundPage();

$(document).ready(function(){	
	$("#visitSite").click(visitSite);
	$("#settings").click(settings);
	$("#update").click(updateFeeds);
	
	chrome.storage.local.get('url', function(data) {
    	if (data.url && data.url.match(regex)){
	       $("#iframe").attr("src", data.url);
    	}else{
    		chrome.browserAction.setBadgeText({text: "!"});
    		visitSite();
    	}
    });
    
    
    $("#footer a").tipTip({maxWidth: "auto", defaultPosition:"top", delay:0, edgeOffset:9});
});

function visitSite(){
	chrome.extension.sendMessage({message: "visitSite"});
}

function updateFeeds(){
	backgroundPage.updateFeeds();
}

function settings(){
	chrome.tabs.create({url: "settings.html"});
}

addEventListener("unload", function (event) {
	backgroundPage.checkUnread();
}, true);
