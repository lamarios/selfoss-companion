var unreadCount = 0;
var expression = /[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/gi;
var regex = new RegExp(expression);
var updatingFeeds = false;

$(document).ready(function(){

	//checkUnread();
	
	chrome.browserAction.onClicked.addListener(visitSite);

	chrome.notifications.onClicked.addListener(visitSite);
	
	updateIconListener();
	
	chrome.extension.onMessage.addListener(function (request, sender, sendResponse) {
		console.log("[MESSAGE] "+request.message);
		
		if (request.message == "check") {
			checkUnread();    
		}
		
		if (request.message == "startUpdateAlarm") {
			startUpdateAlarm();    
		}
		
		if (request.message == "stopUpdateAlarm") {
			stopUpdateAlarm();    
		}
				
		if (request.message == "restartUpdateAlarm") {
			stopUpdateAlarm();    
			startUpdateAlarm();    
		}
		
		if (request.message == "visitSite") {
			visitSite();    
		}
		
		if(request.message == "updateIconListener"){
			updateIconListener();
		}
	});
	
	//checking if we need to start the update alarm
	 chrome.storage.local.get('update', function(data) {
		if (data.update){
			startUpdateAlarm();
		}else{
			checkUnread();
		}
		startUnreadAlarm();
    });
    
    //Showing Settings when the extension is installed for the first time
    chrome.runtime.onInstalled.addListener(function(details) {
    	if(details.reason == "install"){
    		chrome.tabs.create({url: "settings.html"});
    	}
    });
});


/*
* Starts the unread alarm that will regularly check the unread count
*/
function startUnreadAlarm(){

	console.log("[UNREAD UPDATE] Creating alarm");
	var alarm = chrome.alarms.create("unreadAlarm", {
		when:0,
		periodInMinutes: 5
	});
	
	console.log("[ALARMS] Adding event to alarm");
	chrome.alarms.onAlarm.addListener(function(alarm) {
		if(alarm.name == "unreadAlarm"){
			checkUnread();
		}
		
		if(alarm.name == "updateAlarm"){
			updateFeeds();
		}
	});
	listAlarms();
}


/*
* Ajax call to the stats URL of the selfoss installation
*/
function checkUnread(){
	if(!updatingFeeds){
		console.log("[UNREAD UPDATE]  Getting unread count");
		chrome.storage.local.get('url', function(data) {
	    	if (data.url && data.url.match(regex)){
	    		console.log("[UNREAD UPDATE]  Calling url"+data.url+"/stats");
		        $.getJSON(data.url+"/stats", updateCounter).fail(failUnread);
	    	}else{
		    	console.log("[UNREAD UPDATE]  Invalid url");
	    		chrome.browserAction.setBadgeText({text: "!"});
	    	}
	    });
    }else{
		console.log("[UNREAD UPDATE] Skipping, update in progress");
    }
}


/*
* Updated the badge counter
*/
function updateCounter(result){
	console.log("[UNREAD UPDATE] parsing result");
	if(result.unread > 0){
		chrome.browserAction.setBadgeText({text: result.unread.toString()});
		
		if(unreadCount < result.unread){
			//Getting old unread count, if different than new one, display notification
    		chrome.notifications.create("unreadCount", {
    		  type: "basic",
			  iconUrl:"logo.png",  // icon url - can be relative
			  title:'Selfoss',  // notification title
			  message:'You have '+result.unread+" unread items.",  // notification body text
			  }
			  ,function(){}
			);
			setTimeout(function(){
				chrome.notifications.clear("unreadCount", function(){});
			}, 3000);
		}
	}else{
				chrome.browserAction.setBadgeText({text: ""});
	}
	
	unreadCount = result.unread;
}


/*
* Happens when the feed update fails
*/
function failUpdate(){
	console.log("[UPDATE TRIGGER] Fail to update feeds");
	chrome.browserAction.setBadgeText({text: "!"});
	updatingFeeds = false;
}


/*
* Happens when the unread count fails
*/
function failUnread(){
	console.log("[UNREAD UPDATE] Fail to get unread count");
	chrome.browserAction.setBadgeText({text: "!"});
}


/*
* Opens a new tab and opens the selfoss URL
*/
function visitSite(tab){
	chrome.storage.local.get('url', function(data) {
    	if (data.url && data.url.match(regex)){
			chrome.tabs.create({url: data.url});
		}else{
			chrome.tabs.create({url: "settings.html"});
		}
	});
}


/*
* Starts the update feeds alarm based on the timer in the preferences
*/
function startUpdateAlarm(timer){
	if(timer == undefined){ // if no timer passed in param, we fetch it
		console.log("[UPDATE TRIGGER] Starting alarm");
		chrome.storage.local.get('timer', function(data) {
      	if (!isNaN(data.timer)){
        	startUpdateAlarm(data.timer);
      	}
    });

	}else{
		console.log("[UPDATE TRIGGER] Creating update alarm timer: "+timer);
		var alarm = chrome.alarms.create("updateAlarm", {
			when:0,
			periodInMinutes: parseInt(timer)
		});
		listAlarms();
	}
}


/*
* Stops the update alarm
*/
function stopUpdateAlarm(){
	console.log("[ALARMS] Getting feed update alarm");
	chrome.alarms.clear("updateAlarm");
	listAlarms();
}


/*
* Ajax call to the feed update url.
*/
function updateFeeds(){
	if(!updatingFeeds){
		console.log("[UPDATE TRIGGER] updating feeds");
		
		updatingFeeds = true;
		chrome.browserAction.setBadgeText({text: "Updating..."});
	
		chrome.storage.local.get('url', function(data) {
	    	if (data.url && data.url.match(regex)){
	    		console.log("[UPDATE TRIGGER]  Calling url "+data.url+"/update");
		        $.get(data.url+"/update", function(){
		        	console.log("[UPDATE TRIGGER] Feed Updating finished");
		        	updatingFeeds = false;
					chrome.browserAction.setBadgeText({text: ""});
					
		        	checkUnread();
		        }).fail(failUpdate);
	    	}else{
	    		updatingFeeds = false;
		    	console.log("[UNREAD UPDATE]  Invalid url");
	    	}
		});
	}else{
		console.log("[UPDATE TRIGGER]  Already updating, skipping.");
	}
}

/*
* Lists down the currently running alarms, for logging purpose
*/
function listAlarms(){
	chrome.alarms.getAll(function (alarms){
		$.each(alarms, function(index, alarm){
			console.log("[ALARM LIST]"+alarm.name);
		});
	});
}

/*
* Update icon's action depending on settings
*/
function updateIconListener(){
	console.log("[ICON LISTENER] Setting icon action listener");
	chrome.storage.local.get('action', function(data) {
    	if (data.action == "iframe"){
	    	chrome.browserAction.setPopup({popup:"popup.html"});
	    }else{
   	    	chrome.browserAction.setPopup({popup:""});
    	}
    });
	
}
