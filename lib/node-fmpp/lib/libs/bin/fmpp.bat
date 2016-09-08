@echo off

REM   Copyright 2014 Attila Szegedi, Daniel Dekany, Jonathan Revusky
REM 
REM   Licensed under the Apache License, Version 2.0 (the "License");
REM   you may not use this file except in compliance with the License.
REM   You may obtain a copy of the License at
REM 
REM   http://www.apache.org/licenses/LICENSE-2.0
REM 
REM   Unless required by applicable law or agreed to in writing, software
REM   distributed under the License is distributed on an "AS IS" BASIS,
REM   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
REM   See the License for the specific language governing permissions and
REM   limitations under the License.
REM
REM   ------------------------------------------------------------------------
REM
REM   This file is a modified version of the file that comes with Ant 1.5.
REM   The original version is copyrighted by The Apache Software Foundation.
REM   The original copyright notice follows:
REM
REM   Copyright (c) 2001-2003 The Apache Software Foundation.  All rights
REM   reserved.

if exist "%HOME%\fmpprc_pre.bat" call "%HOME%\fmpprc_pre.bat"

if "%OS%"=="Windows_NT" @setlocal

set FMPP_SCRIPT_DIR=%~dp0

rem --------------------------------
rem Collect cmd line args
rem --------------------------------
set FMPP_CMD_LINE_ARGS=%1
if ""%1""=="""" goto endArgs
:nextArg
shift
if ""%1"" == """" goto endArgs
set FMPP_CMD_LINE_ARGS=%FMPP_CMD_LINE_ARGS% %1
goto nextArg
:endArgs

if "%SystemDrive%" == "" goto systemDriveMissing
goto systemDriveOk
:systemDriveMissing
set SystemDrive=C:
:systemDriveOk

rem --------------------------------
rem Find the FMPP home
rem --------------------------------
set FMPP_HOME_ADJ=%FMPP_HOME%
if "%FMPP_HOME_ADJ%" == "" goto noFmppHomeEnv
if exist "%FMPP_HOME_ADJ%" goto endFindHome
if exist "%FMPP_HOME_ADJ%\nul" goto endFindHome
:noFmppHomeEnv
set FMPP_HOME_ADJ=%FMPP_SCRIPT_DIR%..
if exist "%FMPP_HOME_ADJ%" goto endFindHome
set FMPP_HOME_ADJ=%SystemDrive%\Program Files\fmpp
if exist "%FMPP_HOME_ADJ%" goto endFindHome
set FMPP_HOME_ADJ=C:\PROGRA~1\fmpp
if exist "%FMPP_HOME_ADJ%\nul" goto endFindHome
set FMPP_HOME_ADJ=C:\PROGRA~2\fmpp
if exist "%FMPP_HOME_ADJ%\nul" goto endFindHome
set FMPP_HOME_ADJ=C:\PROGRA~3\fmpp
if exist "%FMPP_HOME_ADJ%\nul" goto endFindHome
set FMPP_HOME_ADJ=C:\PROGRA~4\fmpp
if exist "%FMPP_HOME_ADJ%\nul" goto endFindHome
set FMPP_HOME_ADJ=%SystemDrive%\fmpp
if exist "%FMPP_HOME_ADJ%" goto endFindHome
set FMPP_HOME_ADJ=C:\fmpp
:endFindHome
if "%FMPP_BAT_DEBUG%" == "on" echo [DEBUG] FMPP_HOME_ADJ: %FMPP_HOME_ADJ%

rem --------------------------------
rem Find the Ant home
rem --------------------------------
set FMPP_ANT_HOME=%ANT_HOME%
if "%FMPP_ANT_HOME%"=="" goto noAntHomeEnv
if exist "%FMPP_ANT_HOME%" goto endFindAnt
if exist "%FMPP_ANT_HOME%\nul" goto endFindAnt
:noAntHomeEnv
set FMPP_ANT_HOME=%SystemDrive%\Program Files\ant
if exist "%FMPP_ANT_HOME%" goto endFindAnt
set FMPP_ANT_HOME=C:\PROGRA~1\ant
if exist "%FMPP_ANT_HOME%\nul" goto endFindAnt
set FMPP_ANT_HOME=C:\PROGRA~2\ant
if exist "%FMPP_ANT_HOME%\nul" goto endFindAnt
set FMPP_ANT_HOME=C:\PROGRA~3\ant
if exist "%FMPP_ANT_HOME%\nul" goto endFindAnt
set FMPP_ANT_HOME=C:\PROGRA~4\ant
if exist "%FMPP_ANT_HOME%\nul" goto endFindAnt
set FMPP_ANT_HOME=%SystemDrive%\ant
:endFindAnt
if "%FMPP_BAT_DEBUG%" == "on" echo [DEBUG] FMPP_ANT_HOME: %FMPP_ANT_HOME%

rem --------------------------------
rem Find lcp.bat
rem --------------------------------
set FMPP_LCP_CMD=%FMPP_SCRIPT_DIR%lcp.bat
if exist "%FMPP_LCP_CMD%" goto endFindLcp
set FMPP_LCP_CMD=%0\..\lcp.bat
if exist "%FMPP_LCP_CMD%" goto endFindLcp
set FMPP_LCP_CMD=%FMPP_HOME_ADJ%\bin\lcp.bat
if exist "%FMPP_LCP_CMD%" goto endFindLcp
set FMPP_LCP_CMD=%FMPP_ANT_HOME%\bin\lcp.bat
if exist "%FMPP_LCP_CMD%" goto endFindLcp
set FMPP_LCP_CMD=%SystemDrive%\Program Files\fmpp\bin\lcp.bat
if exist "%FMPP_LCP_CMD%" goto endFindLcp
set FMPP_LCP_CMD=C:\PROGRA~1\fmpp\bin\lcp.bat
if exist "%FMPP_LCP_CMD%" goto endFindLcp
set FMPP_LCP_CMD=C:\PROGRA~2\fmpp\bin\lcp.bat
if exist "%FMPP_LCP_CMD%" goto endFindLcp
set FMPP_LCP_CMD=C:\PROGRA~3\fmpp\bin\lcp.bat
if exist "%FMPP_LCP_CMD%" goto endFindLcp
set FMPP_LCP_CMD=C:\PROGRA~4\fmpp\bin\lcp.bat
if exist "%FMPP_LCP_CMD%" goto endFindLcp
set FMPP_LCP_CMD=%SystemDrive%\fmpp\bin\lcp.bat
if exist "%FMPP_LCP_CMD%" goto endFindLcp
set FMPP_LCP_CMD=C:\fmpp\bin\lcp.bat
if exist "%FMPP_LCP_CMD%" goto endFindLcp

echo Can't find lcp.bat! It should be in the same directory as fmpp.bat,
echo or in the bin subdirectory of the FMPP or Ant home directory.
echo.
echo You may need to set the FMPP_HOME or ANT_HOME environment variables,
echo or store lcp.bat in the same directory as the fmpp.bat you are executing
echo now.
echo.
echo The home directories was:
echo - The FMPP home was: "%FMPP_HOME_ADJ%"
echo - The Ant home was: "%FMPP_ANT_HOME%"
goto end
:endFindLcp
if "%FMPP_BAT_DEBUG%" == "on" echo [DEBUG] FMPP_LCP_CMD: %FMPP_LCP_CMD%

rem --------------------------------
rem Find Java
rem --------------------------------
if "%JAVA_HOME%" == "" goto noJavaHome
if not exist "%JAVA_HOME%\bin\java.exe" goto noJavaHome
set FMPP_JAVA_CMD=%JAVA_HOME%\bin\java.exe
goto endFindJava
:noJavaHome
set FMPP_JAVA_CMD=java.exe
:endFindJava
if "%FMPP_BAT_DEBUG%" == "on" echo [DEBUG] FMPP_JAVA_CMD: %FMPP_JAVA_CMD%

rem --------------------------------
rem Build the classpath
rem --------------------------------
set FMPP_LIB_DIR=%FMPP_HOME_ADJ%\lib
if exist "%FMPP_LIB_DIR%\fmpp.jar" goto libdirFound
set FMPP_LIB_DIR=%FMPP_ANT_HOME%\lib
if exist "%FMPP_LIB_DIR%\fmpp.jar" goto libdirFound
set FMPP_LIB_DIR=%SystemDrive%\Program Files\fmpp\lib
if exist "%FMPP_LIB_DIR%\fmpp.jar" goto libdirFound
set FMPP_LIB_DIR=C:\PROGRA~1\fmpp\lib
if exist "%FMPP_LIB_DIR%\fmpp.jar" goto libdirFound
set FMPP_LIB_DIR=C:\PROGRA~2\fmpp\lib
if exist "%FMPP_LIB_DIR%\fmpp.jar" goto libdirFound
set FMPP_LIB_DIR=C:\PROGRA~3\fmpp\lib
if exist "%FMPP_LIB_DIR%\fmpp.jar" goto libdirFound
set FMPP_LIB_DIR=C:\PROGRA~4\fmpp\lib
if exist "%FMPP_LIB_DIR%\fmpp.jar" goto libdirFound
set FMPP_LIB_DIR=%SystemDrive%\fmpp\lib
if exist "%FMPP_LIB_DIR%\fmpp.jar" goto libdirFound
set FMPP_LIB_DIR=C:\fmpp\lib
if exist "%FMPP_LIB_DIR%\fmpp.jar" goto libdirFound

echo Can't find fmpp.jar!
echo.
echo The fmpp.jar, together with the other required jars (eg. freemarker.jar),
echo should be stored in the lib subdirectory of the FMPP or Ant home directory.
echo.
echo You may need to set the FMPP_HOME or ANT_HOME environment variables, or
echo check if the fmpp.jar is really in the lib subdirectory.
echo.
echo The home directoryes was:
echo - The FMPP home was: "%FMPP_HOME_ADJ%"
echo - The Ant home was: "%FMPP_ANT_HOME%"
goto end
:libdirFound
if "%FMPP_BAT_DEBUG%" == "on" echo [DEBUG] FMPP_LIB_DIR: %FMPP_LIB_DIR%
set LOCALCLASSPATH=%CLASSPATH%
for %%i in ("%FMPP_LIB_DIR%\*.jar") do call "%FMPP_LCP_CMD%" %%i
if exist "%JAVA_HOME%\lib\tools.jar" call "%FMPP_LCP_CMD%" %JAVA_HOME%\lib\tools.jar
if "%FMPP_BAT_DEBUG%" == "on" echo [DEBUG] LOCALCLASSPATH: %LOCALCLASSPATH%

rem --------------------------------
rem Set FMPP_CONSOLE_COLS env var
rem --------------------------------

2>NUL call :setConColsVar
goto :afterSetConColsVar

:setConColsVar
setlocal EnableDelayedExpansion
FOR /F "delims=" %%i IN ('mode con /status') DO if ("!out!"=="") (set out=%%i) else (set out=!out![BR]%%%i)
( endlocal
  set "FMPP_CONSOLE_COLS=%out%"
)
exit /b

:afterSetConColsVar

rem --------------------------------
rem Call FMPP
rem --------------------------------
"%FMPP_JAVA_CMD%" -classpath "%LOCALCLASSPATH%" "-Dfmpp.home=%FMPP_HOME_ADJ%" "-Dfmpp.userHome=%HOME%" %FMPP_OPTS% fmpp.tools.CommandLine %FMPP_CMD_LINE_ARGS%

:end
set LOCALCLASSPATH=
set FMPP_HOME_ADJ=
set FMPP_ANT_HOME=
set FMPP_JAVA_CMD=
set FMPP_LCP_CMD=
set FMPP_CMD_LINE_ARGS=
set FMPP_LIB_DIR=
set FMPP_SCRIPT_DIR=
set _CLASSPATHCOMPONENT=

if "%OS%"=="Windows_NT" @endlocal

if exist "%HOME%\fmpprc_post.bat" call "%HOME%\fmpprc_post.bat"
