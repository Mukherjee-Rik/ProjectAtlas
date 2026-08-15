@echo off
cd /d "%~dp0"
call "%APPDATA%\npm\pnpm.cmd" --filter web dev -- -p 3001
