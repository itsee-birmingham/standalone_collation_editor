#!/bin/bash
BASEDIR=$(pwd)

java -jar collatex/collatex-tools-1.8-SNAPSHOT.jar -S &
COLLATEXPID=$!

python3 bottle_server.py $BASEDIR

kill $COLLATEXPID
