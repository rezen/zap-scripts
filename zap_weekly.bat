:: @TODO check if weekly release is already installed

SET weekly="2018-11-12"

IF "%1"=="" (  
  ECHO "[i] No weekly release specified"
) ELSE (
  SET weekly="%~1"
)

WHERE powershell
IF %ERRORLEVEL% NEQ 0 (
  ECHO "[!] Can not install without powershell"
  EXIT /b
)

ECHO "[i] Installing weekly %weekly%"

SET zap_dir=C:\Program Files\OWASP\Zed Attack Proxy\
SET full_path=%userprofile%\ZAP_WEEKLY_D-%weekly%.zip
SET url=https://github.com/zaproxy/zaproxy/releases/download/w%weekly%/ZAP_WEEKLY_D-%weekly%.zip

IF NOT EXIST "%userprofile%\tmp" mkdir =%userprofile%\tmp

IF EXIST %zap_dir% (
  ECHO "[i] ZAP is installed"
) ELSE (
  ECHO "[!] ZAP is not installed, install it first"
  EXIT /b
)

ECHO %full_path%

IF EXIST %full_path% (
  ECHO "[i] Already downloaded ZAP weekly release"
) ELSE (
  powershell -Command "(New-Object Net.WebClient).DownloadFile('%url%', '%full_path%')")
)

IF NOT EXIST %userprofile%\tmp\ZAP_D-%weekly% (
  ECHO "[i] Extracting archive"
  powershell -NoP -NonI -Command "Expand-Archive '%full_path%' '%userprofile%\tmp'"
)

:: Copy files 
XCOPY /Y /S /E %userprofile%\tmp\ZAP_D-%weekly%\* %zap_dir%\

:: Rename the ZAP jar files 
REN %zap_dir%\zap-2.7.0.jar %zap_dir%\_zap-2.7.0.jar
REN %zap_dir%\zap-D-*.jar %zap_dir%\zap-2.7.0.jar

:: Replace weekly details in bat file with the zap stable 
powershell -Command "(gc %zap_dir%\zap.bat) -replace 'zap-%weekly%.jar', 'zap-2.7.0.jar' | Out-File %zap_dir%\zap.bat"

