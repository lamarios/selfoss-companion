var expression = /[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/gi;
var regex = new RegExp(expression);
var update;
var oldTimer = 20;

if (typeof String.prototype.startsWith != 'function') {
  String.prototype.startsWith = function (str){
    return this.slice(0, str.length) == str;
  };
}

if (typeof String.prototype.endsWith != 'function') {
  String.prototype.endsWith = function (str){
    return this.slice(-str.length) == str;
  };
}


$(document).ready(function(){
	
	$("#settings").submit(saveChanges);
	
	$("#update").click(toggleTimer);
	
	console.log("Trying to get settings");
	chrome.storage.local.get('url', function(data) {
      if (data.url)
        $("#url").val(data.url);
    });
    
    chrome.storage.local.get('update', function(data) {
      if (data.update){
      	$("#update").prop("checked", data.update);
      	update = data.update;
      	
      }
      toggleTimer();
    });
    
    
    chrome.storage.local.get('timer', function(data) {
      if (!isNaN(data.timer)){
        $("#timer").val(data.timer);
        oldTimer = data.timer;
      }else{
     	$("#timer").val(20);
      }
    
    });
    
    chrome.storage.local.get('action', function(data) {
      if (data.action){
        $("#action").val(data.action);
      }
    });
  
});


/*
* Save changes made to the settings
*/
function saveChanges() {

	// Get a value saved in a form.
	var url = $("#url").val();
	var timer = $("#timer").val();
	var newUpdate = $("#update").prop("checked");
	
	
	if(!url.startsWith("http://") && !url.startsWith("https://") ){
		url = "http://"+url;
	}
	
	if(url.endsWith("/")){
		url = url.slice(0, - 1);
	}
	/*
	var username = $("#username").val();
	var password = $("#password").val();
	*/
	// Check that there's some code there.
	if (!url) {
		alert('Error: No URL specified');
		return false;
	}
	
	if(!url.match(regex)){
		alert("Invalid URL");
		return false;
	}
	
	if(isNaN(timer)){
		alert("The timer must be a number");
		return false;
	}
	
	//alert(url);
	// Save it using the Chrome extension storage API.
	chrome.storage.local.set({
		'url': url,
		'update': newUpdate,
		'timer': timer,
		'action': $("#action").val()
		//'username': username,
		//'password': password
		}, function() {
		alert('Settings saved');
	});
	
	chrome.extension.sendMessage({message: "check"}, function(response) {

	});
	
	//only if the update has been enabled, we trigger the alarm
	if(newUpdate && !update){
		chrome.extension.sendMessage({message: "startUpdateAlarm"});
	}
	
	//Stops the alarm if it was running previously
	if(!newUpdate && update){
		chrome.extension.sendMessage({message: "stopUpdateAlarm"});
	}
	
	//If w the timer is changed, the alarm has to be restarted
	if(update && timer != oldTimer){
		chrome.extension.sendMessage({message: "restartUpdateAlarm"});
	}
	
	chrome.extension.sendMessage({message: "updateIconListener"});

	
	update = newUpdate;
	return false;
}


/*
* Slide up or down the timer input
*/
function toggleTimer(){
	if($("#update").prop("checked")){
		$("#timer-container").slideDown();
	}else{
		$("#timer-container").slideUp();
	}
}

