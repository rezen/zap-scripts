import urlparse
import urllib
import itertools
from org.parosproxy.paros.model import Model
from org.parosproxy.paros.extension.history import ExtensionHistory
from org.parosproxy.paros.network import HttpSender

def logger(note):
	print("[try-removing-query] " +  str(note))

def _fix_dict(data):
	for key in data:
		val = data[key]
		if len(val) == 1:
			data[key] = val[0]
	return data

def _findsubsets(items, size):
    return list(set(itertools.combinations(items, size)))

def invokeWith(msg):
	# org.apache.commons.httpclient.URI	
	url = msg.getRequestHeader().getURI().toString()
	qry = urlparse.urlsplit(url).query
	qs = urlparse.parse_qs(qry)
	data = dict(qs)
		
	if not data:
		logger("No query ")
		return 

	# https://www.zaproxy.org/2.5/javadocs/org/parosproxy/paros/network/HttpSender.html#MANUAL_REQUEST_INITIATOR
	sender = HttpSender(Model.getSingleton().getOptionsParam().getConnectionParam(), True, 1)
	history = ExtensionHistory()
	all_params = data.keys()
	data = _fix_dict(data)
	query_sets = [[]] # Need the first query to be empty
	for i in range(1, len(all_params)):
    	query_sets = query_sets + _findsubsets(all_params, i)
	query_sets = [list(s) for s in query_sets]
    
    logger("Starting data")
	logger(data)
    logger("Trying " + str(len(query_sets)) + " different query combos ... ")

	for params in query_sets:
		query = {p: data[p] for p in params}
		logger("Querying with params: " + ", ".join(query))
		logger(query)
		clone = msg.cloneRequest()
		new_qs = urllib.urlencode(query)
		clone.getRequestHeader().getURI().setQuery(new_qs)
		sender.sendAndReceive(clone, True)
		logger("body: " + clone.getResponseBody().toString())
		history.addHistory(clone, 1)
		
	"""
	dialog = history.getResendDialog()
	dialog.setMessage(clone)
 	dialog.setVisible(True)
	"""