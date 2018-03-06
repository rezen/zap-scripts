""" Parse your ZAP config file and output in command line flag format """
from __future__ import print_function
import sys
from sets import Set
import json
import os.path
import xmltodict

def encode_value(value):
	if value is None:
		return ''
	
	if not isinstance(value, basestring):
		value = str(value)

	if ' ' not in value:
		return value
	return "'%s'" %  value


def config_to_flags(conf, key):
	if conf is None:
		return Set([key + "="])

	if isinstance(conf, basestring):
		return Set([key + "=" + encode_value(conf)])
	
	if isinstance(conf, int):
		return Set([key + "=" + encode_value(conf)])

	flag = "" + key
	flags = Set()

	if isinstance(conf, list):
		for idx, val in enumerate(conf):
			flags = flags.union(config_to_flags(val, flag + "\(%s\)" %idx))
		return flags

	iterator = conf if isinstance(conf, dict) else xrange(len(conf))
	for attr in iterator:
		if isinstance(attr, basestring) and '@' in attr:
			continue
		
		subconf = iterator[attr]
		sub_attr = ".%s" % attr if isinstance(attr, basestring) else '(%s)' % attr
		flags = flags.union(config_to_flags(subconf, flag +  sub_attr ))			
	return flags

def print_flags_from_config(config):
	del config['view']
	flags = Set()
	for key in config:
		flags = flags.union(config_to_flags(config[key], key))

	flags = list(flags)
	flags.sort()
	[print('-config ' + flag) for flag in flags]


def main():
	""" Reads first arg for path to config.xml for parsing """
	config_xml = os.path.expanduser("~") + "/.ZAP_D/config.xml"

	if len(sys.argv) > 1:
		config_xml = sys.argv[1]
	
	print("[i] Reading config %s" % config_xml)
	if not os.path.isfile(config_xml):
		print("[!] File does not appear to exist")
		exit(1)
	
	with open(config_xml) as fh:
		data = xmltodict.parse(fh.read())
		config = data['config']
		print_flags_from_config(config)

if __name__ == "__main__":
	main()