/* exported invokeWith */
// Target the javascript file that has route declarations for angularjs 1.x
function logger() {
  print('[' + this['zap.script.name'] + '] ' + arguments[0]);
}

var Control           = Java.type('org.parosproxy.paros.control.Control')
var ExtensionSelenium = Java.type('org.zaproxy.zap.extension.selenium.ExtensionSelenium');
var Thread            = Java.type('java.lang.Thread');

function getAll(re, body) {
	var match;
  var matches = [];
   
  do {
    match = re.exec(body);
    if (match) {
      matches.push(match);
    }
  } while (match);
  return matches;
}

function invokeWith(msg) {
  var selenium = Control.getSingleton().getExtensionLoader().getExtension(ExtensionSelenium.class);
  var driver   = selenium.getWebDriverProxyingViaZAP(1, 'chrome');
  var url = msg.getRequestHeader().getURI();
  var root = url.getScheme() + '://' + url.getHost();
  
  if (url.getPort() != 80 && url.getPort() != 443) {
    root += ':' + url.getPort();
  }
  
  root += '/';

	var body = msg.getResponseBody().toString();
	var regexWhen = /\.when\(["']([^"']+)["']/g;
  var regexGet = /\.get\(["']([^"']+)["']/g;
  driver.get(root);

  Thread.sleep(4000);
	var matches = getAll(regexWhen, body);
  var visited = {};

  for (var i in matches) {
    var endpoint = matches[i][1];
    if (visited[endpoint]) {
      continue;
    }
    driver.get(root + '#' +  endpoint);
    Thread.sleep(2000);
    visited[endpoint] = 1;
  }
  
  driver.quit();
  matches = getAll(regexGet, body);
  for (var i in matches) {
    logger(root + matches[i][1]);
  }
}

