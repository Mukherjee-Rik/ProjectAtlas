@echo off
cd /d "%~dp0"
call "%APPDATA%\npm\pnpm.cmd" --filter api start:dev
