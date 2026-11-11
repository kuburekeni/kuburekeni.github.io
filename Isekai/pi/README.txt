THE FULL GUIDE IS  HOW-TO-INSTALL.txt  IN THE MAIN isekai FOLDER.

  install-console.sh  - turns a Raspberry Pi OS *Lite* card into a games
                        console that boots straight into the game (recommended)
  setup-pi.sh         - keeps the normal desktop and opens the game
                        fullscreen on top of it
  console/            - the bits the console setup installs (local game
                        server, boot-time updater, controller pairing)

The notes below are for the desktop method (setup-pi.sh).

I GOT ISEKAI'D — ON A RASPBERRY PI 400
=======================================

1. GET THE GAME ONTO THE PI
   Copy the whole Isekai folder (every file, plus this pi folder) into
   your home folder on the Pi and name it "isekai", so you end up with
   /home/<you>/isekai/index.html.
   - From a USB stick: plug it into the Pi 400 and drag the folder across.
   - Or put the SD card in your PC: if it has Raspberry Pi OS on it, the
     home folder is on the big Linux partition (Windows can't see that one
     without extra software), so a USB stick is usually easier.

2. RUN THE SETUP ONCE
   Open Terminal on the Pi (Ctrl+Alt+T) and type:
       bash ~/isekai/pi/setup-pi.sh
   then:
       sudo reboot
   The Pi boots straight into the game, fullscreen. It works with no
   internet; cloud saves sync whenever the Pi is online.

   Leave the game:   Alt+F4
   Start it again:   double-click "I Got Isekai'd" on the desktop
   Undo the setup:   bash ~/isekai/pi/setup-pi.sh --remove

3. XBOX ONE CONTROLLER
   USB cable: just plug it in. It works straight away.
   Bluetooth (Xbox One S / Series controllers with Bluetooth):
       a. Hold the pairing button on top of the controller until the
          Xbox logo flashes fast.
       b. On the Pi: click the Bluetooth icon > Add Device > pick
          "Xbox Wireless Controller" — or in Terminal:
              bluetoothctl
              scan on            (wait for "Xbox Wireless Controller")
              pair  XX:XX:XX:XX:XX:XX
              trust XX:XX:XX:XX:XX:XX
              connect XX:XX:XX:XX:XX:XX
              exit
       c. If it connects then drops straight away, run once and reboot:
              echo 'options bluetooth disable_ertm=Y' | sudo tee /etc/modprobe.d/xbox_bt.conf
   If any button does the wrong thing: in the game, Settings >
   Controller setup, and press each button when it asks.

   Buttons
       Left stick / D-pad   move (push the stick all the way to run)
       A                    talk / confirm
       B                    back
       X (hold)             run
       Y  or  View          world map
       Menu                 pause menu
       LB / RB              page up / down in long lists

4. KEEPING IT SMOOTH
   Settings > Graphics quality is on Auto: it starts on Medium on the
   Pi and steps down by itself if the game slows. Low is the smoothest.
   Settings > Show frame rate puts an FPS counter in the corner.
