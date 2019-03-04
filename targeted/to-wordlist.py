import re
import urlparse
import urllib
import itertools
import hashlib 
from org.parosproxy.paros.model import Model
from org.parosproxy.paros.extension.history import ExtensionHistory
from org.parosproxy.paros.network import HttpSender
from org.parosproxy.paros.control import Control
from org.parosproxy.paros.view import View

# tree     = Model.getSingleton().getSession().getSiteTree()
# rootNode = tree.getRoot()
completed = {}

def logger(note):
    print("[generate-wordlist] " +  str(note))

def message_words(msg):
    path = msg.getRequestHeader().getURI().getPath()
    content_type = msg.getResponseHeader().getHeader('Content-Type')
    body = msg.getResponseBody().toString()
    
    if content_type is None or body is None:
        return []
    
    # @todo process different content types
    if "html" not in content_type:
        # logger("Not the correct content-type " + content_type)
        return []

    body = body.encode('utf-8').strip()
    logger("Using content found on " + path)
    hashed = hashlib.md5(body).hexdigest()

    if hashed in completed:
        logger("Duplicate content ...")
        return []

    completed[hashed] = {}
    
    # Strip out scripts
    wo_scripts = re.subn(r'<(script).*?</\1>(?s)', '', body)[0]
    # Strip out tags
    # @todo extract alt, title, placeholder attributes
    no_tags = re.sub('<\/?[^>]*>', ' ', wo_scripts)
    wordlist = [re.sub(r'\W+', ' ', w) for w in no_tags.split()]
    return wordlist
    

# http://www.zaproxy.org/2.5/javadocs/org/parosproxy/paros/model/SiteNode.html
def callback(node):
    history = node.getPastHistoryReference()
    size    = history.size()
    last_ref = node.getHistoryReference()
    msg = None

    if last_ref == None:
        # logger("No history reference?")
        return []

    status_code = last_ref.getStatusCode()

    if  status_code == None or (status_code > 299 or status_code < 200):
        # logger("Bad status code " + str(status_code))
        return []
    
    try:
        msg = last_ref.getHttpMessage()
    except Exception:
        pass
    return message_words(msg)


def crawlNode(node, level, words):
  completed = {}
  words = words + callback(node)
  for i  in range(0, node.getChildCount()):
    child = node.getChildAt(i)
    words = words + crawlNode(child, level + 1, words)
  return words

# crawlNode(rootNode, 0)

def invokeWith(msg):
    # https://www.zaproxy.org/2.5/javadocs/org/parosproxy/paros/model/HistoryReference.html
    wordlist = []
    ref = msg.getHistoryRef()
    node = ref.getSiteNode()
    wordlist = crawlNode(node, 0, wordlist)
    wordlist = list(set([w.strip() for w in wordlist]))
    wordlist.sort()
    
    # https://www.zaproxy.org/2.5/javadocs/org/parosproxy/paros/view/OutputPanel.html
    panel = View.getSingleton().getOutputPanel()
    panel.clear()
    panel.setTabFocus()
    panel.append("--------------------- wordlist -------------------------")
    panel.append("\n".join(wordlist))

