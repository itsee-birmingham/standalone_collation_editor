SET BASEDIR="%CD%"
echo %BASEDIR%

start java -classpath collatex/lib/\* -Dapp.name="collatex-server" -Dapp.repo="collatex/lib" -Dapp.home="collatex" -Dbasedir="collatex" eu.interedition.collatex.http.Server

python3 bottle_server.py %BASEDIR%
