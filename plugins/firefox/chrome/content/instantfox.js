//(function() {
  var   InFoxPrefs    = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService),
        StringService = Components.classes["@mozilla.org/intl/stringbundle;1"].getService(Components.interfaces.nsIStringBundleService),
        LocaleService = Components.classes["@mozilla.org/intl/nslocaleservice;1"].getService(Components.interfaces.nsILocaleService),
        StringBundle  = StringService.createBundle("chrome://instantfox/locale/instantfox.properties", LocaleService.getApplicationLocale()),
        I18n          = function(param) {
          return StringBundle.GetStringFromName(param);
        };

  InFoxPrefs.QueryInterface(Components.interfaces.nsIPrefBranch2);

	

  XULBrowserWindow.InsertShaddowLink = function (shaddow2dsp, query) {
	
	if (gURLBar) {

		if(shaddow2dsp != '' && shaddow2dsp != query){
			gURLBar.InsertSpacerLink(gURLBar.value);
			var tmpshaddow = '';
			
			if(shaddow2dsp.toLowerCase().indexOf(query.toLowerCase()) == 0){
				// continue typing current keyword remove typed chars!
				if(query.length != shaddow2dsp.length){
					tmpshaddow = shaddow2dsp.substr(query.length, shaddow2dsp.length);
				}else{
					tmpshaddow = '';
				}
				InstantFox.right_shaddow = tmpshaddow;
				gURLBar.InsertShaddowLink(tmpshaddow);
			}else{
				// keyword is new
				InstantFox.right_shaddow = '';
				gURLBar.InsertShaddowLink('');
				//gURLBar.InsertShaddowLink(url);
			}
		}else{
			InstantFox.right_shaddow = '';
			gURLBar.InsertSpacerLink('');
			gURLBar.InsertShaddowLink('');
		}
	}
  }
  
  // MAC adjustments:
  XULBrowserWindow.InsertShaddowStyle = function (four_params) { //e.g. "1px 0 0 0"
	
	if (gURLBar) {
		if(four_params){
			gURLBar.InsertShaddowStyle(four_params);
		}
	}

  }
  
  XULBrowserWindow.InsertShaddowStyleStart = function (start) { //e.g. "-2px"
	
	if (gURLBar) {
		if(start){
			gURLBar.InsertShaddowStyleStart(start);
		}
	}

  }
  // end MAC

var HH = {
    _url: {
      hash: 'http://search.instantfox.net/#',
      host: 'search.instantfox.net',
      intn: 'chrome://instantfox/locale/index.html',
	  actp: '', // current shortcut in use
	  seralw: false, // search always on every key up!
	  abort: '', // abort request because enter pressed
	  ctabID: '' // used for tab handeling
    },
    
	get _ctabID() gBrowser.mCurrentTab.linkedPanel,
	_history: { // history handling
	  service: //histsvc.QueryInterface(Components.interfaces.nsIBrowserHistory),
	  			Components.classes["@mozilla.org/browser/nav-history-service;1"]
                               .getService(Components.interfaces.nsIBrowserHistory),
							   	  
	  uri: function(spec) {
		return  Components.classes["@mozilla.org/network/io-service;1"].
			   getService(Ci.nsIIOService).
			   newURI(spec, null, null);
	  },
	  
	  hide: function(url2remove){
		if(!url2remove) return false;
		
	  	var toRemove = this.uri(url2remove);
		this.service.removePage(toRemove);
		
		return true;
	  }
	},

	_os: {
	  name:Components.classes["@mozilla.org/xre/app-info;1"]  
           .getService(Components.interfaces.nsIXULRuntime).OS,
	  set:false
	},
	
    _isOwnQuery: false,
    
    // -- Helper Methods --
    _query: function(query, event) {
      // Query used to replace gURLBar.value onLocationChange
      HH._q = query || gURLBar.value;
      HH._url._ctabID = HH._ctabID;
      
      if (HH._timeout) window.clearTimeout(HH._timeout);
      
      HH._timeout = window.setTimeout(function(e) {
        HH._oldState    = HH._state ? { loc: HH._state.loc, id: HH._state.id } : { loc: false, id: false };
        HH._state       = InstantFox.query(HH._q, e);
        HH._isOwnQuery  = true;
        HH._focusPermission(false);
        
        // load location or load InstantFox site
        var _location;
        
        if (typeof HH._state.loc == 'string') {
          _location = (HH._state.loc == InstantFox._name) ? HH._url.intn : HH._state.loc;
        } else {
          _location = HH._url.hash + HH._q;
        }

        // Don't spam the history!
	    if(HH._url.seralw){
		  if (HH._state.id != HH._oldState.id) {
            content.document.location.replace(_location);
			HH._history.hide(_location);
          } else {
            content.document.location.assign(_location);
			HH._history.hide(_location);
          }
		}
      }, 200, event);
      
	  
    },
	
	_goto4comp: function(url2go) {
		if(!this._url.seralw){
			// add belong2tab check!
			HH._isOwnQuery = true;
			content.document.location.assign(url2go);
			HH._history.hide(url2go);
		}
		return true;
	},
    
    _init: function() {
      if(!HH._os.set){
	    if(HH._os.name == 'Darwin'){ // MAC style adjustments returned Darwin
		  XULBrowserWindow.InsertShaddowStyle("-2px 0 0 0");
		  XULBrowserWindow.InsertShaddowStyleStart("1px");
	    }
	  }
	  HH._os.set = true;
	  // execute it only once browser sttarts
	  
	  /*
	  var _prefVersion = 'extensions.' + InstantFox._name + '.version';
      if (InFoxPrefs.getCharPref(_prefVersion) != InstantFox._version) {
          // open Locale Index and Help Document
          content.document.location = HH._url.intn;
          // set new Version
          InFoxPrefs.setCharPref(_prefVersion, InstantFox._version);
       }
	   */
    },
    	
    _observeURLBar: function() {
      gURLBar.addEventListener('blur', function(e) {
		// Return power to Site if urlbar really lost focus
        if (HH._isOwnQuery && !gURLBar.mIgnoreFocus && e.originalTarget == gURLBar.mInputField) {
		  HH._blankShaddow();
          gURLBar.value = content.document.location;
		  HH._history.hide(content.document.location);
		  gBrowser.userTypedValue = null;
		  HH._isOwnQuery = false;
          HH._focusPermission(true);
        }
      }, false);
    },
    
    // The current content-window-location is the InstantFox Output-Site
    _isInstantFox: function(loc) {
      loc = loc || content.document.location;
      try { return loc.hostname ? loc.hostname.search(HH._url.host) > -1 : false; }
      catch(ex) { return false; }
    },
    
	_blankShaddow: function(){	
	  if(!InstantFox.current_shaddow) return false; 		// not needed already blank!
	  InstantFox.current_shaddow = '';
	  XULBrowserWindow.InsertShaddowLink('','');
	},
	
    // Assuming that a space in the trimmed Urlbar indicates a InstantFox call
    _isQuery: function() {
      if (gURLBar.value.length < 3){
	    this._blankShaddow();
		return false;
	  }
	  // match keywords here!
      var found = false;
	  for(var plugin in  InstantFox.Shortcuts) {
      	if(gURLBar.value.indexOf(plugin+' ') == 0){
			found = plugin; // set Shortkey
			this._url.actp = plugin;
			break;
		}
      }
	  if(!found){
	  	this._blankShaddow('','');
		return false;
	  }
	  
	  var query = gURLBar.value.substr((plugin.length+1),gURLBar.value.length); // plugin.length Shortkey + Space => length to cut off
	  XULBrowserWindow.InsertShaddowLink(InstantFox.current_shaddow,query);
	  
	  return true; //(gURLBar.value.replace(/^\s+|\s+$/g, '').search(' ') > -1);
    }
};

//firefox 4 doesn't need _focusPermission
if('Services' in window) {
	HH._focusPermission = function() {	
	}
} else {
	HH._focusPermission = function(access) {
		var permission = (access ? 'allAccess' : 'noAccess');
		InFoxPrefs.setCharPref('capability.policy.default.HTMLInputElement.focus',   permission);
		InFoxPrefs.setCharPref('capability.policy.default.HTMLAnchorElement.focus',  permission);
    }
}
  
var instantFoxLoad = function(event) {
	dump('onload')
	//window.removeEventListener('load', arguments.callee, true);        
	// setup URLBar for components
	gURLBar.setAttribute('autocompletesearch',	'instantFoxAutoComplete');
	// tell InstantFox which internationalization & URLBar to use
    InstantFox._i18n = I18n;
	//gBrowser.addProgressListener(HH._observe, Components.interfaces.nsIWebProgress.NOTIFY_LOCATION);
	
	gURLBar.addEventListener('keydown', _keydown, false);
	gURLBar.removeAttribute('oninput');
	gURLBar.addEventListener('input', _input, false);
	HH._observeURLBar();
	
	// init plugins
    gBrowser.addEventListener("load", function(event) {
      if (event.originalTarget instanceof HTMLDocument) {
        for(var plugin in InstantFox.Plugins) {
          try { InstantFox.Plugins[plugin].init(event.originalTarget.defaultView.wrappedJSObject); }
          catch(ex) {}
        }
      }
    }, true);
    HH._init();

}
  
var instantFoxUnload = function(event) {
	dump('---***---',arguments.callee.caller)
	// todo: better cleanup
	//gURLBar.removeEventListener('keydown', _keydown, false);
	//gURLBar.removeEventListener('input', _input, false);	
}
    
// Prevent pressing enter from performing it's default behaviour
var _keydown = function(event) {
  HH._url.abort=false;
  var key = event.keyCode ? event.keyCode : event.which,
		alt = event.altKey, meta = event.metaKey, ctrl = event.ctrlKey, shift = event.shiftKey;
  if(HH._isQuery()){
	if (key == 9 || (!ctrl && !shift && key == 39)) { // 9 == Tab 
	  if(InstantFox.right_shaddow != ''){
		gURLBar.value += InstantFox.right_shaddow;
		InstantFox.right_shaddow = '';
		//gURLBar.controller.handleText(true)
		_input()
		HH._url.abort=true;
		event.preventDefault();
	  }
	} else if (key == 39 && ctrl && !shift) { // 39 == RIGHT
	  if(InstantFox.right_shaddow != '' && gURLBar.selectionEnd==gURLBar.value.length){
		/* window.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIDOMWindowUtils)
			.sendNativeKeyEvent(0, 0, 0, InstantFox.right_shaddow[0], ''); */			
		gURLBar.value += InstantFox.right_shaddow[0]
		gURLBar.controller.handleText(true)
		_input()
		event.preventDefault();
	  }
	} else if (key == 13 && !alt && !meta && !ctrl) { // 13 == ENTER
	  HH._url.abort=true;
	  //InstantFox.Plugins[InstantfoxHH._url.actp]; // improve it later!
	  
	  var tmp = InstantFox.query(gURLBar.value,event);
	  //content.document.location.assign(tmp['loc']);
	  
	  gURLBar.value = tmp['loc'];		
	  
	  if(content.document.location.href != tmp['loc']){
		content.document.location.assign(tmp['loc']);
	    HH._history.hide(tmp['loc']);
	  }
	  event.preventDefault();
	  gURLBar.value = tmp['loc'];
	  gBrowser.userTypedValue = null;

	  
	  HH._blankShaddow();
	  HH._isOwnQuery  = false;
	  HH._focusPermission(true);
	
	  gBrowser.selectedBrowser.focus();	
	  //gBrowser.selectedBrowser.focus();		
	  //gBrowser.mCurrentBrowser.focus();
	  //content.document.defaultView.focus();
	} 
  }else if(key == 32 && ctrl) { // 32 == SPACE
	gURLBar.value = InstantFox.queryFromURL()
  }
};

// Perform query if space was detected
var _input = function(event) {
	HH._url.abort=false;
	HH._location = gURLBar.value;
	gBrowser.userTypedValue = HH._location;
	dump(HH._isQuery())
	if (HH._isQuery()) {
		HH._query(gURLBar.value, event);
	}
	// show autocomplete popup when not InstantFox!
	else{	
	}
};
 
window.addEventListener('load', instantFoxLoad, true);
//window.addEventListener('unload', instantFoxUnload, true);




	//InFoxPrefs.clearUserPref('browser.urlbar.autocomplete.enabled');
    //InFoxPrefs.clearUserPref('capability.policy.default.HTMLInputElement.focus');
    //InFoxPrefs.clearUserPref('capability.policy.default.HTMLAnchorElement.focus');


//})();

// modify URLBarSetURI defined in browser.js
function URLBarSetURI(aURI) {
	if (HH._isOwnQuery) {
		if (HH._url._ctabID == HH._ctabID){
			return;
		} else { //hide shadow if user switched tabs
			HH._blankShaddow();
			HH._isOwnQuery  = false;
			HH._focusPermission(true);
		}
	}
    var value = gBrowser.userTypedValue;
    var valid = false;
    if (value == null) {
        let uri = aURI || getWebNavigation().currentURI;
        if (gInitialPages.indexOf(uri.spec) != -1) {
            value = content.opener ? uri.spec : "";
        } else {
            value = losslessDecodeURI(uri);
        }
        valid = uri.spec != "about:blank";
		// do not allow "about:blank"
		if(!valid) value = '';
    }
    gURLBar.value = value;
    SetPageProxyState(valid ? "valid" : "invalid");
}
