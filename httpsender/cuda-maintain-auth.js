// Auth is flaky with some Barracuda appliances, this helps those out
if (typeof println == 'undefined') this.println = print;

// Logging with the script name is super helpful!
function logger() {
  print('[' + this['zap.script.name'] + '] ' + arguments[0]);
}

function isStaticUrl(url) {
  if (url.indexOf('.xml') !== -1) {
    return true;
  }

  if (url.indexOf('.css') !== -1) {
    return true;
  }
  
  if (url.indexOf('.gif') !== -1) {
    return true;
  }

  if (url.indexOf('.js') !== -1) {
    return true;
  }
  
  if (url.indexOf('.txt') !== -1) {
    return true;
  }

  if (url.indexOf('.htm') !== -1) {
    return true;
  }
  return false;
}

var HttpSender = Java.type('org.parosproxy.paros.network.HttpSender');
var ScriptVars = Java.type('org.zaproxy.zap.extension.script.ScriptVars');

var regexes = {
  et:   /et=([0-9]{10})/,
  password: /password=([0-9a-z]{32})/,
  user: /user=([^\&]+)/,
}

function sendingRequest(msg, initiator, helper) {  
  var reqbody = msg.getRequestBody().toString();
  var headers = msg.getRequestHeader();
  var url     = headers.getURI().toString();
  var qry     = headers.getURI().getQuery();
  var cookies = headers.getCookieParams();
  
  if (initiator === HttpSender.SPIDER_INITIATOR) {}
  
  if (isStaticUrl(url)) {return true;}

  // Is directory ...
  if (url[url.length -1] === '/') {return true;}
  
  var config = {}
  
  config.et       = ScriptVars.getGlobalVar("cuda.et");
  config.password = ScriptVars.getGlobalVar("cuda.password");
  config.user     = ScriptVars.getGlobalVar("cuda.user");

  // Don't re-write attempts to auth
  // @todo possible drop?
  if (headers.getMethod() === 'POST' && reqbody.indexOf('login_page=1') !== -1) {
    logger('tring to auth-again?!')
    return false;
    }

  // If password already in query ... continue @todo review
  if (qry !== null && qry.toString().indexOf(config.password) !== -1) {
    return true;
  }

  var newqry = "auth_type=Local&et=" + config.et + "&password=" + config.password + "&user=" + config.user;

  // If existing query, replace old query params with fresh values
  if (qry !== null) {
    newqry = '' + qry;
    
    for (var name in config) {
      var rex = regexes[name];
      if (newqry.indexOf(name) !== -1) {
        newqry = newqry.replace(rex, name + '=' + config[name])
      } else {
        newqry += "&" + name + '=' + config[name]
      }
    }
  }

  headers.getURI().setQuery(newqry)
  return true
}

function responseReceived(msg, initiator, helper) {
  var reqbody     = msg.getRequestBody().toString();
  var resbody     = msg.getResponseBody().toString()
  var headers     = msg.getRequestHeader();
  var resheaders  = msg.getResponseHeader()
  var url         = headers.getURI().toString()
  var setCookie   = resheaders.getHeader('Set-Cookie');
  
  // If not Set-Cookie response ... move on
  if (setCookie === null) {return;}

  var cookie      = setCookie.toString();
  var sessionInfo = cookie.split(';')[0].split('=')
  var key         = sessionInfo[0];
  var secret      = sessionInfo[1];
  
  // No valid session set
  if  (!secret || secret.length <= 1) {return;}

  // Is response JSON? @todo check content-type
  if (resbody[0] !== '{') {return;}

  logger('cookie-set')
  
  // Make cookie info available
  ScriptVars.setGlobalVar("cuda.cookie_value", secret);
  ScriptVars.setGlobalVar("cuda.cookie_key", key);

  try {
    var data = JSON.parse(resbody);
  } catch (e) {
    return;
  }

  // If auth request was not succesful move on
  if (!data['success']) {return;}

  for (var name in regexes) {
    var rex = regexes[name];
    var value = rex.exec(data['redirect'])[1];
    // Store query params
    ScriptVars.setGlobalVar("cuda." + name, value)
  }
}
