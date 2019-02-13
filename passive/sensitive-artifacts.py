import re

files = {
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

def add_alert(pscan, msg, fname, cat):
    risk = 3
    confidence = 3
    name = "Sensitive Artifact[s] Exposed %s" % (cat)
    description = "The file (%s) was found" % fname
    attack = ""
    evidence = ""
    parameter = ""
    other = msg.getResponseBody().toString()
    solution = " ".join([
		"Make sure to remove this file as part of deployment",
		"or configure the web server to hide it from public access"
	])
    pscan.raiseAlert(
        risk, confidence, name, description,
        msg.getRequestHeader().getURI().toString(),
        parameter, attack, other, solution, evidence, 0, 0, msg);


def scan(pscan, msg, src):
	status_code = msg.getResponseHeader().getStatusCode() 
	if not (status_code >= 200 and status_code <= 299):
		return

	path = msg.getRequestHeader().getURI().getPath()
	
	for category in files:
		for f in files[category]:
			if path.endswith(f):
				return add_alert(pscan, msg, f, category)

	print("exposed-files", path)
