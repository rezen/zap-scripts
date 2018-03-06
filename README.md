# zap-scripts

- https://www.slideshare.net/FrancoisRaynaud/devseccon-london-2017-zap-scripting-workshop-by-simon-bennetts

```
# To generate cli flags
# e.g. reponse -config zest.incResponses=true
python parse-config.py 
zap.sh -config zest.incResponses=true


# Create a override config file which is acceptabled via the cli, pipe into file ...
python parse-config.py | sed 's/-config //g;s/\\(/(/g;s/\\)/)/g' > overrides.config

# Remove the default settings & keep only the ones you want
zap.sh -configfile $(pwd)/overrides.config


# Example flags
-config script.scripts\(0\).name="Bob"
-config script.scripts\(0\).engine="Mozilla Zest"
-config script.scripts\(0\).type=proxy
-config script.scripts\(0\).enabled=true
-config script.scripts\(0\).file="/opt/scripts/bob.zst"
```
