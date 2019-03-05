
var PluginPassiveScanner = Java.type("org.zaproxy.zap.extension.pscan.PluginPassiveScanner");

var sensitiveFiles = {
    'Config': [
        'config.xml', 
        'config.json', 
        'config.yaml', 
        'config.yml', 
        'config.ini', 
        'config.cfg',
    ], 
    'VCS': [
        '.git/HEAD',
        '.hg/store/00manifest.i',
        '.svn/entries',
    ],
    'Secrets': [
        '.env',
        '.dockerenv',
        'id_rsa',
    ],
    'Packages': [
        '.npmrc',
        'package.json',
        'Gemfile',
        'Gemfile.lock',
        'Rakefile', 
        'setup.py', 
        'requirements.txt',
    ]
}

function logger() {
  print('[' + this['zap.script.name'] + '] ' + arguments[0]);
}


function appliesToHistoryType(historyType) {
	return PluginPassiveScanner.getDefaultHistoryTypes().contains(historyType);
}

function addAlert(pscan, msg, fname, cat) {
    var risk = 3;
    var confidence = 3;
    var name = "Sensitive Artifact(s) Exposed - "  + cat;
    var description = "The following artifact was found that should probably not be expose. " +  fname;
    var attack = "";
    var evidence = "";
    var parameter = "";
    var other = msg.getResponseBody().toString()
    var solution = [
		"Make sure to remove this file as part of deployment",
		"or configure the web server to hide it from public access"
	].join(" ");
    pscan.raiseAlert(
        risk, confidence, name, description,
        msg.getRequestHeader().getURI().toString(),
        parameter, attack, other, solution, evidence, 0, 0, msg);
}

function scan(pscan, msg, src) {
	var statusCode = msg.getResponseHeader().getStatusCode();
	if (!(statusCode >= 200 && statusCode <= 299)) {
        return;
    }
	logger(statusCode);

	var path = msg.getRequestHeader().getURI().getPath();
	
	for (var category in sensitiveFiles) {
		for (var i in sensitiveFiles[category]) {
            var f = sensitiveFiles[category][i];
            if (path.endsWith(f)) {
			    logger("Found something interesting - " + category);
                return addAlert(pscan, msg, f, category);
            }
        }
    }
}