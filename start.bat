@echo off
title Sash Planner Pro
cd /d "%~dp0"
echo Starting Sash Planner Pro...
start http://localhost:8080
python -m http.server 8080
pause
