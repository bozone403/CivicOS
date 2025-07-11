echo '
rm -rf node_modules client/node_modules server/node_modules dist client/dist server/dist
rm -f package-lock.json client/package-lock.json server/package-lock.json
npm install
cd client && npm install && cd ../server && npm install && cd ..
./hardstart.sh
' > fix.sh
chmod +x fix.sh
./fix.sh
