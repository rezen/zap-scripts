var Model            = Java.type('org.parosproxy.paros.model.Model');
var ExtensionHistory = Java.type('org.parosproxy.paros.extension.history.ExtensionHistory');
var HttpSender       = Java.type('org.parosproxy.paros.network.HttpSender');

var sender  = new HttpSender(Model.getSingleton().getOptionsParam().getConnectionParam(), true, 1)
var history = new ExtensionHistory();

/*
// Keep for reference
var dialog = history.getResendDialog();
dialog.setMessage(clone);
dialog.setVisible(true)
*/

function logger() {
	print('[' + this['zap.script.name'] + '] ' + arguments[0]);
}

// https://stackoverflow.com/questions/1714786/query-string-encoding-of-a-javascript-object
function serialize(obj) {
	var str = [];
	for (var p in obj)
	  if (obj.hasOwnProperty(p)) {
		str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
	  }
	return str.join("&");
  }

// https://stackoverflow.com/questions/2090551/parse-query-string-in-javascript
function parseQuery(queryString) {
    var query = {};
    var pairs = (queryString[0] === '?' ? queryString.substr(1) : queryString).split('&');
    for (var i = 0; i < pairs.length; i++) {
        var pair = pairs[i].split('=');
        query[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
    }
    return query;
}

// https://codereview.stackexchange.com/questions/7001/generating-all-combinations-of-an-array
function getCombinations(chars) {
	var result = [];
	var f = function(prefix, chars) {
		logger(prefix)
		for (var i = 0; i < chars.length; i++) {
			result.push(prefix.concat(chars[i]));
			f(prefix.concat(chars[i]), chars.slice(i + 1));
		}
	}
	f([], chars);
	return result;
}

function invokeWith(msg) {
	var query = msg.getRequestHeader().getURI().getQuery()
	if (query.length === 0) {
		logger("No query ")
		return;
	}

	var queryData = parseQuery(query);
	var allParams = Object.keys(queryData);
	var queryCombos = getCombinations(allParams);
	queryCombos.push([]);

	logger("Working through " + queryCombos.length + " combo(s)");
	for (var i in queryCombos) {
		var data = {};
		var params = queryCombos[i];

		for (var j in params) {
			var key = params[j];
			data[key] = queryData[key];
		}

		logger();
		logger("Sending params: " + params.join(", "));
		var newQuery = serialize(data);
		clone = msg.cloneRequest();
		clone.getRequestHeader().getURI().setQuery(newQuery);
		sender.sendAndReceive(clone, true);
		history.addHistory(clone, 1);
		logger("body: " + clone.getResponseBody().toString());
	}
}