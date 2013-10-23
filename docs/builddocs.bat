cd /d %~dp0
START /W jsduck --config jsduck-conf.json -o out
cp images/ice-logo.png out/resources/images/ice-logo.png