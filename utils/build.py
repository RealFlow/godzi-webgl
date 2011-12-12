#!/usr/bin/env python

try:
	import argparse
	ap = 1
except ImportError:
	import optparse
	ap = 0

import os
import tempfile
import sys
import re
import commands
import shutil

OSGJS = [
		"osgjs/osg-debug-0.0.5.js",
		"osgjs/osg-extras.js"
]

OSGEARTH = [
        "osgearth/osgearth.js",
        "osgearth/FunctionLocation.js",
        "osgearth/ShaderFactory.js",
        "osgearth/VirtualProgram.js",
        "osgearth/Extent.js",
        "osgearth/EllipsoidModel.js",
        "osgearth/Profile.js",
        "osgearth/GeodeticProfile.js",
        "osgearth/MercatorProfile.js",
        "osgearth/TileKey.js",
        "osgearth/ImageLayer.js",
		"osgearth/HeightField.js",
		"osgearth/ElevationLayer.js",	
        "osgearth/Map.js",
        "osgearth/MapNode.js",
        "osgearth/Tile.js"
]

READYMAP = [
        "jquery/jquery.mousewheel.js",		
		"math.js",
		"array.js",
        "readymap.js"
]

READYMAP_UI = [
        "readymap/ui/Manipulator.js",
        "readymap/ui/EarthManipulator.js",		
		"readymap/ui/MapManipulator.js",
		"readymap/ui/MapView.js",		
        "readymap/ui/PositionedElement.js",
        "readymap/ui/PositionEngine.js"
]

READYMAP_DATA = [
        "readymap/data/ArcGISImageLayer.js",
		"readymap/data/GeoRSSLayer.js",
		"readymap/data/GeoRSSReader.js",
		"readymap/data/HeatMap.js",
		"readymap/data/Building.js",
		"readymap/data/Map.js",
		"readymap/data/TMSImageLayer.js",
		"readymap/data/TMSElevationLayer.js",
		"readymap/data/WMSImageLayer.js",	
		"readymap/data/WOEIDWeatherLayer.js"	
]


READYMAP_CONTROLS = [
        "readymap/controls/Controls.js",
        "readymap/controls/GeoRSSList.js",
		"readymap/controls/Icon.js",       
		"readymap/controls/Label.js"	,
        "readymap/controls/LayerSwitcher.js",
        "readymap/controls/PlaceSearch.js",
		"readymap/controls/Pan.js",
		"readymap/controls/Zoom.js"
]

version = '0.0.0'
#commit = '0'

def bomstrip(text):
    if text.startswith( '\xef\xbb\xbf' ):
        return text[3:]
    else:
        return text


def merge(files):

	buffer = []

	for filename in files:
		with open(os.path.join('..', 'js', filename), 'r') as f:
			text = f.read()
			text = bomstrip(text)            
			buffer.append(text)
#			buffer.append(f.read())

	return "".join(buffer)


def output(text, filename):

	with open(os.path.join('..', 'build', filename), 'w') as f:
		f.write(text)


def compress(text):

	in_tuple = tempfile.mkstemp()
	with os.fdopen(in_tuple[0], 'w') as handle:
		handle.write(text)

	out_tuple = tempfile.mkstemp()
	# os.system("java -jar yuicompressor-2.4.2.jar %s --type js -o %s --charset utf-8 -v" % (in_tuple[1], out_tuple[1]))
	os.system("java -jar compiler.jar --language_in=ECMASCRIPT5 --js %s --js_output_file %s" % (in_tuple[1], out_tuple[1]))

	with os.fdopen(out_tuple[0], 'r') as handle:
		compressed = handle.read()

	os.unlink(in_tuple[1])
	os.unlink(out_tuple[1])

	return compressed
    
    

#def addHeader(text, endFilename):
#	return ("// %s commit %s - http://github.com/gwaldron/godzi-webgl\n" % (endFilename, commit )) + text


def makeDebug(text):
	position = 0
	while True:
		position = text.find("/* DEBUG", position)
		if position == -1:
			break
		text = text[0:position] + text[position+8:]
		position = text.find("*/", position)
		text = text[0:position] + text[position+2:]
	return text


def buildLib(files, debug, unminified, filename):

	text = merge(files)

	if debug:
		text = makeDebug(text)
		filename = filename + '-debug'


        folder = ''
	versionned = filename + "-"+version + '.js'
        lastversion = filename + '.js'

	print "=" * 40
	print "Compiling", versionned
	print "=" * 40

	if not unminified and not debug:
		text = compress(text)
	
	#output(addHeader(text, versionned), folder + versionned)
	output(text, folder + versionned )
        # copy folder + versionned to last
        shutil.copyfile("../build/"+folder + versionned, "../build/"+folder + lastversion)



def buildIncludes(files, filename):

	template = '\t\t<script type="text/javascript" src="../../js/%s"></script>'
	text = "\n".join(template % f for f in files)

	output(text, filename + '.js')


def parse_args():

	if ap:
		parser = argparse.ArgumentParser(description='Build and compress Three.js')
		parser.add_argument('--release', help='Generate release versions', action='store_true')
		parser.add_argument('--debug', help='Generate debug versions', action='store_const', const=True, default=False)
		parser.add_argument('--unminified', help='Generate unminified versions', action='store_const', const=True, default=False)

		args = parser.parse_args()

	else:
		parser = optparse.OptionParser(description='Build and compress Three.js')
		parser.add_option('--release', dest='release', help='Generate release versions', action='store_true')
		parser.add_option('--debug', dest='debug', help='Generate debug versions', action='store_const', const=True, default=False)
		parser.add_option('--unminified', help='Generate unminified versions', action='store_const', const=True, default=False)

		args, remainder = parser.parse_args()

	# If no arguments have been passed, show the help message and exit
	if len(sys.argv) == 1:
		parser.print_help()
		sys.exit(1)

	return args

def getVersion():
        p = re.compile('[0-9]+.[0-9]+.[0-9]+')
        lines = open("../js/readymap.js", 'r').readlines()
        for l in lines:
                if l.find("ReadyMap.version") != -1:
                        res = p.search(l)
                        if res is not None:
                                version = res.group(0)
                                return version

#def getCommit():
#	output = commands.getoutput("git log -n 1")
#        res = re.compile('commit (\S*)')
#        return res.search(output).group(1)

def main(argv=None):
	args = parse_args()
	debug = args.debug
	unminified = args.unminified

	config = [
                ['readymap', 'includes', OSGJS + OSGEARTH + READYMAP + READYMAP_UI + READYMAP_DATA + READYMAP_CONTROLS, args],
                ]

        global version
        version = getVersion()
        #global commit
        #commit = getCommit()

        #print "osg version " + version + " commit " + commit
	for fname_lib, fname_inc, files, arg in config:
                buildLib(files, debug, unminified, fname_lib)
                if debug:
                        buildIncludes(files, fname_inc)

if __name__ == "__main__":
	main()

