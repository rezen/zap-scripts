// With many applications you, especially legacy, you want to
// treat the query params values are unique, since a query param
// indicate a unique page. Unfortunately, you may want to ignore
// some of the query params as unique, say if you have a session
// identifier in the url ... This takes the url, strips out the 
// extra query params you don't care about & checks if that has
// already been requested & drops if it has


// Logging with the script name is super helpful!
function logger() {
    print('[' + this['zap.script.name'] + '] ' + arguments[0]);
}
// 
var ExtensionHistory = Java.type('org.parosproxy.paros.extension.history.ExtensionHistory');
var Model = Java.type('org.parosproxy.paros.model.Model');
var Control = Java.type('org.parosproxy.paros.control.Control');
var History = Control.getSingleton().getExtensionLoader().getExtension(ExtensionHistory.class)
var session = Model.getSingleton().getSession();
var tree = session.getSiteTree()
var rootNode = tree.getRoot();
var excluded = session.getExcludeFromProxyRegexs()
var contexts = Model.getSingleton().getSession().getContexts();


function inContext(host) {
    for (var i in contexts) {
        var context = contexts[i];
        var regexes = context.getIncludeInContextRegexs
        for (var j in regexes) {
            var regex = regexes[j];
            // @todo moar better
            if (regex.indexOf(host) !== -1) {
                logger(context.getName() + " includes " + host);
                return true
            }
        }
    }
}



function crawlNode(node) {
    var j;
    var history = node.getPastHistoryReference();
    var size = history.size();

    var host = null;
    try {
        var uri = history.get(0).getURI();
        host = uri.getScheme() + "://" + uri.getHost();
    } catch (error) {}

    var pattern = host + ".*"
    if (host !== null && inContext("cuda")) {
        logger("Leave " + host);
        return;
    }


    if (host !== null) {
        if (excluded.indexOf(pattern) === -1) {
            session.addExcludeFromProxyRegex(pattern);
            logger("Excluding " + pattern + " from proxy")

        }
    }
    for (j = 0; j < node.getChildCount(); j++) {
        var child = node.getChildAt(j);
        crawlNode(child);
    }


    for (var i = 0; i < size; i++) {
        // History.delete(history.get(i));
    }

    try {
        tree.removeNodeFromParent(node);
    } catch (error) {}

}



crawlNode(rootNode)
