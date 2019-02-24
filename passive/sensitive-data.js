var PluginPassiveScanner = Java.type("org.zaproxy.zap.extension.pscan.PluginPassiveScanner");

// Logging with the script name is super helpful!
function logger() {
    print(this['zap.script.name'] + '] ' +  arguments[0]);
}

// Look for a key in the object
function lookupKey(data, find, path) {
    path = path || [];
    for (var key in data) {
        var sub = data[key];
        var p = path.slice(0).concat(key);
        if (key === find) {
            return [true, p];
        }

        if (Array.isArray(sub) || typeof sub === "object") {
            var lookup = lookupKey(sub, find, p);
            if (lookup[0] === true) {
                return lookup;
            }
        }
   }
   return [false, path];
 }


// Get all the keys in the object
function getKeys(data, path) {
    path = path || [];
    var keys = [];
    for (var key in data) {
	    var sub = data[key];
	    var p = path.slice(0).concat("" + key);
        keys.push(path.concat(key));

        if (typeof sub == "object" || Array.isArray(sub)) {
		    keys = keys.concat(getKeys(sub, p));
	    }
    }
    return keys;
}

function appliesToHistoryType(historyType) {
	return PluginPassiveScanner.getDefaultHistoryTypes().contains(historyType);
}

function scan(pscan, msg, src) {
  	var statusCode = msg.getResponseHeader().getStatusCode();
  	if (!(statusCode >= 200 && statusCode <= 299)) {
        return;
    }
  
  	var path = msg.getRequestHeader().getURI().getPath();
  	var body = msg.getResponseBody().toString();
  	var contentType = msg.getResponseHeader().getHeader('Content-Type');

	if (contentType === null) {
        return;
    }

    if (body === null) {
        return;
    }
	
    if (~body.indexOf("PRIVATE KEY-----")) {
		logger("A private key???")
		return;
    }

    if (!~body.indexOf("password")) {
        return;
    }

  	var start = body[0];

  	if (!~contentType.indexOf("json")) {
        return;
    }

    if (start == "{" || start == "[") {
        var data = {};
        logger("Checking json");
        try {
            data = JSON.parse(body);
        } catch (e) {
            return;
        }

        var lookups = ['password', 'ssn'];
        for (var i in lookups) {
            var find = lookups[i];
            var lookup = lookupKey(data, find);
            var found = lookup[0];
            var keyPath = lookup[1].join(".");
              
            if (found) {
                logger("Found a password field: " + keyPath);
                var risk = 3
                var confidence = 3
                var name = "Sensitive Data Exposure"
                var description = "In the JSON response the following key was found: " + keyPath
                var attack = "";
                var evidence = "";
                var parameter = "";
                var other = msg.getResponseBody().toString();
                var solution = "";

                pscan.raiseAlert(
                    risk, confidence, name, description,
                    msg.getRequestHeader().getURI().toString(),
                    parameter, attack, other, solution, evidence, 0, 0, msg);
            }
        }
    }
}