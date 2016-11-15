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

if "%FMPP_BAT_DEBUG%" == "on" echo [DEBUG] lcp.bat invoked with: %1

set _CLASSPATHCOMPONENT=%1
if ""%1""=="""" goto gotAllArgs
shift

:argCheck
if ""%1""=="""" goto gotAllArgs
set _CLASSPATHCOMPONENT=%_CLASSPATHCOMPONENT% %1
shift
goto argCheck

:gotAllArgs
set LOCALCLASSPATH=%_CLASSPATHCOMPONENT%;%LOCALCLASSPATH%

