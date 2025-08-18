const { app} = require('electron');
const fs = require('fs');
const path = require('path');
const settingsPath = path.join(app.getPath('userData'), 'settings.json');

function loadSettings() {
  try {
    return JSON.parse(fs.readFileSync(settingsPath));
  } catch {
    return {};
  }
}

function saveSettings(newSettings) {
  fs.writeFileSync(settingsPath, JSON.stringify(newSettings, null, 2));
  console.log(settingsPath);
}

module.exports = {
  loadSettings,
  saveSettings
};