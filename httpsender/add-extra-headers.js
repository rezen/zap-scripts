/*exported sendingRequest, responseReceived*/
// Logging with the script name is super helpful!
function logger() {
  print('[' + this['zap.script.name'] + '] ' + arguments[0]);
}

var HttpSender    = Java.type('org.parosproxy.paros.network.HttpSender');
var ScriptVars    = Java.type('org.zaproxy.zap.extension.script.ScriptVars');

var ignoreHeader = [
  'Connection', 
  'Accept',
  'Origin',
  'Host',
  'Content-Type',
  'Content-Length',
  'Referer', 
  'Cookie', 
  'User-Agent', // @todo user-agent may be special?
  'Referer', 
  'Accept-Language',
  'Access-Control-Request-Headers',
  'Access-Control-Request-Method',
  'Date',
  'Cache-Control',
  'Pragma',
  'Upgrade',
  'Via',
  'Upgrade-Insecure-Requests',
  'X-NewRelic-ID',
]

/*
@todo
var ignoreHeaderPatterns = [
  /If-.+/,
]
*/
function sendingRequest(msg, initiator, helper) {  
  if (initiator === HttpSender.AUTHENTICATION_INITIATOR) {
    logger("Trying to auth")
    return msg;
  }
  var varKey = "headers-" + hostname
  var hostname = msg.getRequestHeader().getHostName()
  var extras = ScriptVars.getGlobalVar(varKey);
  var headers = msg.getRequestHeader().getHeaders()

  if (extras) {
   try {
    if (extras.length < 4) {
     extras = false
    } else {
 	    extras = extras ? JSON.parse(extras) : {};
      if (extras && Object.keys(extras).length === 0) {
        extras = false
      }
    }
   } catch(err) {
     logger(err)
     extras = false
   }
  }
  
  if (!extras) {
     extras = {}
     for (var z in headers) {
       var header = headers[z]
       var name = header.getName()
       var val = header.getValue()
       if (~ignoreHeader.indexOf(name)) {
         continue
       }
       
       logger("Found interesting header: " + name)
       extras[name] = val
     }

     ScriptVars.setGlobalVar(varKey, JSON.stringify(extras))
  }

  for (var key in extras) {
     if (msg.getRequestHeader().getHeader(key)) {
       logger("Setting extra header - " + key + ": " +  extras[key])
       msg.getRequestHeader().setHeader(key, extras[key]);
     }
  }
  return msg;
}

function responseReceived(msg, initiator, helper) {}
