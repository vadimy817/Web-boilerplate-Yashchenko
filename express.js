const path = require('path');
const express = require('express');

const app = express();
// app.use(compression());

// Сторонні бібліотеки (встановлені через npm) віддаємо під /vendor/<назва>
const VENDOR_DIRS = {
  leaflet: 'node_modules/leaflet/dist',
  'chart.js': 'node_modules/chart.js/dist',
  lodash: 'node_modules/lodash',
  dayjs: 'node_modules/dayjs',
  webdatarocks: 'node_modules/@webdatarocks/webdatarocks',
};

Object.entries(VENDOR_DIRS).forEach(([name, dir]) => {
  app.use(`/vendor/${name}`, express.static(path.join(__dirname, dir)));
});

app.get('/favicon.ico', (req, res) => res.status(200).send());
app.use(express.static('./src'));
app.listen(3001, () => console.log('Example app listening on port 3001!'));
