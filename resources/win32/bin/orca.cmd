@echo off
setlocal
set "SBBGT_LEGACY_CLI=orca"
set "LAUNCHER=%~dp0sbbgt.exe"
if not exist "%LAUNCHER%" (
  echo Cannot locate the native sbbgt CLI launcher at "%LAUNCHER%" 1>&2
  exit /b 1
)
"%LAUNCHER%" %*
exit /b %ERRORLEVEL%
