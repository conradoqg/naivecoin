@echo off
title Concord Core Node Setup
REM set /p ip="Enter IP: "
echo localhost> bin\ip.pref
start /d bin start-logged.bat
start electron .
exit