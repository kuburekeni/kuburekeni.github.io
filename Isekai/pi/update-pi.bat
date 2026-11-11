@echo off
rem =====================================================================
rem  I Got Isekai'd - send an update to the Pi over Wi-Fi
rem  Put this file next to the new isekai.zip and double-click it
rem  (or drag a zip onto it). It copies the zip to the Pi and restarts it;
rem  the Pi installs the new version while it starts up. Saves are kept.
rem =====================================================================
set PI=isekai@isekai.local
set ZIP=%~1
if "%ZIP%"=="" set ZIP=%~dp0isekai.zip
if not exist "%ZIP%" (
  echo Can't find isekai.zip next to this file. Put them in the same folder, or drag the zip onto this file.
  pause
  exit /b 1
)
echo.
echo Sending %ZIP% to the Pi (%PI%)...
echo When it asks for a password, type the Pi's password (nothing shows as you type).
echo.
scp "%ZIP%" %PI%:/tmp/isekai.zip
if errorlevel 1 goto fail
echo.
echo Installing and restarting the Pi...
ssh -t %PI% "sudo mv /tmp/isekai.zip /boot/firmware/isekai.zip && rm -rf /tmp/iu && unzip -q -o /boot/firmware/isekai.zip -d /tmp/iu && sudo bash /tmp/iu/isekai/pi/console/refresh-tools.sh; sudo reboot"
echo.
echo Done. The Pi is restarting with the new version.
pause
exit /b 0

:fail
echo.
echo Couldn't reach the Pi. Check that it's switched on and on the same Wi-Fi,
echo and that SSH is turned on (see HOW-TO-INSTALL.txt, "Updating from your PC").
pause
exit /b 1
