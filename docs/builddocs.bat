cd /d %~dp0
START /W jsduck --config jsduck-conf.json -o html
cp images/ice-logo.png html/resources/images/ice-logo.png