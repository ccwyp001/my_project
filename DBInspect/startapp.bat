@echo off
pushd "%~dp0"
pushd "%cd%\"
"%cd%\flask\Scripts\python.exe" "%cd%\startapp.py" >>"%cd%\run.log" 2>&1