import { app } from 'electron';
import fs from 'fs';
import path from 'path';
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
export { loadSettings, saveSettings };
