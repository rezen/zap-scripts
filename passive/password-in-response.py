import re
import json
from org.zaproxy.zap.extension.pscan import PluginPassiveScanner

# There should never be these keys from an API
blacklist_keys = ["password", "ssn", "secret"]

# What content should never be returned from an API?
# @todo private keys
blacklist_regex = []

def appliesToHistoryType(historyType):
    return PluginPassiveScanner.getDefaultHistoryTypes().contains(historyType)


def crawl_dict_for_key(data, key, full_path=[]):
    if not isinstance(data, list) and not isinstance(data, dict):
        return None, full_path

    if isinstance(data, list):
        for idx, val in enumerate(data):
            found, fpath = crawl_dict_for_key(val, key, full_path + [str(idx)])
            if found is not None:
                return found, fpath
        return None, full_path

    for k, v in data.iteritems():
        if k == key:
            return v, full_path
        
        found, fpath = crawl_dict_for_key(v, key, full_path + [k])
        if found is not None:
            return found, fpath

    return  None, full_path

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
  	body = msg.getResponseBody().toString()
  	content_type = msg.getResponseHeader().getHeader('Content-Type')

	if not content_type:
		return
	
	if not body:
		return
	
	if 'password' not in body:
		return

  	start = body[0]

  	if "json" in content_type and (start == "{" or start == "["):
    		print("Checking json")
    		data = json.loads(body)
    		found, full_path = crawl_dict_for_key(data, 'password')
		print(data)
		print(found, full_path)