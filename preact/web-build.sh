npm run build --no-prerender
rm ../firmware/web/*
cp ./build/bundle.esm.js ../firmware/web
cp ./build/bundle.css ../firmware/web
cp ./build/*.html ../firmware/web
cp ./build/favicon.ico ../firmware/web