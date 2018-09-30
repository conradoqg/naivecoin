@echo off
title Concord Core Node Setup
echo Welcome to the Dev-Build of Concord Core. Please input your machine's IP address below, your node will be ran on this and will be shared among it's peers.
echo WARNING - If you are running an offline node, or simply haven't port-forwarded, please type "localhost" and hit Enter.
REM set /p ip="Enter IP: "
echo localhost> bin\ip.pref
start /d bin start-logged.bat
start electron .
exit