echo '-------------------------------------------------'
echo 'Remember to set MOS_PORT env variable, examples:'
echo '   export MOS_PORT=ws://192.168.0.102/rpc'
echo '   export MOS_PORT=$(ls /dev/cu.usb*)'
echo '-------------------------------------------------'
echo 'Copying 200.html'
mos put ./firmware/web/200.html
echo 'Copying index.html'
mos put ./firmware/web/index.html
echo 'Copying bundle.css'
mos put ./firmware/web/bundle.css
echo 'Copying bundle.esm.js'
mos put ./firmware/web/bundle.esm.js
echo 'Copying favicon.ico'
mos put ./firmware/web/favicon.ico
