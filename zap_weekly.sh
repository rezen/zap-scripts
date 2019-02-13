#!/bin/bash

appdir=/opt/zap
weekly="${1:-2018-11-12}"

mkdir -p ~/tmp/
cd ~/tmp

command -v zap.sh

if [ `uname` == 'Darwin' ]
then
    appdir="/Applications/OWASP\ ZAP.app/Contents/Java/"
else 
    appdir="$(find / -type f -name zap.sh | tail -n1)"
fi

echo "[i] weekly = ${weekly}"
echo "[i] appdir = ${appdir}"

if [ ! -f ZAP_WEEKLY_D-${weekly}.zip ]
then
    wget https://github.com/zaproxy/zaproxy/releases/download/w${weekly}/ZAP_WEEKLY_D-${weekly}.zip
fi

if [ ! -d ZAP_D-${weekly} ]
then
    unzip ZAP_WEEKLY_D-${weekly}.zip 
fi

bash -c "cp -R ~/tmp/ZAP_D-${weekly}/* ${appdir}"
