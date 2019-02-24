#!/bin/bash

set -e

if [ "$(uname)" == "Darwin" ] && [ -z "$FORCE" ]
then
    echo '[i] Looks like you are on Mac, we recommend using the installer and then updating with zap_weekly.sh'
    echo '    you can download ZAP here https://github.com/zaproxy/zaproxy/wiki/Downloads'
    echo '    or if you can also `brew cask install owasp-zap`'
    echo
    exit 1
fi

HERE=$(dirname $(realpath "$0"))
RELEASE="${1:-2018-09-03}"

if [[ $EUID -ne 0 ]]
then
  echo '[!] You gotta run with sudo or as root'
  exit 1
fi

if (command -v zap.sh)
then
  echo '[i] ZAP is already installed'
  exit 0
fi

mkdir -p ~/tmp

echo "[i] Getting installer for release=${RELEASE}"
installer="https://github.com/zaproxy/zaproxy/releases/download/w${RELEASE}/ZAP_WEEKLY_D-${RELEASE}.zip"
installer_zip=$(echo $HOME/tmp/$(basename "${installer}"))
zap_folder="ZAP_D-${RELEASE}"

if [ ! -f "${installer_zip}" ]
then
  echo "[i] Downloading installer"
  { 
    curl -sLS "${installer}" --output "${installer_zip}"
  } || { 
    echo "[!] There was an issues downloading ZAP"
  }
fi

cd ~/tmp
unzip  -o "${installer_zip}"

rsync -av "${HOME}/tmp/${zap_folder}" /opt/
ln -sf "/opt/${zap_folder}/zap.sh" /usr/local/bin/zap.sh

if (command -v apt-get)
then
  apt-get update -y
  jre_exists=$(apt-cache search --names-only 'openjdk-8-jdk' | grep -v headless | awk '{print $1}')
  if [ "$jre_exists" != "openjdk-8-jdk" ] 
    then
      add-apt-repository ppa:openjdk-r/ppa
      apt-get update -y
  fi
  apt-get install -y xvfb firefox openjdk-8-jdk
fi

if (command -v yum)
then
  yum install -y xorg-X11-server-Xvfb gdk-pixbuf2 firefox java-1.8.0-openjdk
fi