import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import {spawn} from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import onnx from 'onnxruntime-node';
import { loadSettings, saveSettings } from './mini-store.js';
import electronSquirrelStartup from 'electron-squirrel-startup';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const settings = loadSettings();


// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (electronSquirrelStartup) {
  app.quit();
}

const createWindow = () =>
{
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Open the DevTools.
  mainWindow.webContents.openDevTools();



  ipcMain.handle("select-path", async () =>
  {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ["openDirectory"],
    });
    if (!result.canceled && result.filePaths.length > 0) {
      settings.musicDir = result.filePaths[0];
      saveSettings(settings);
      return result.filePaths[0]; // return selected directory path
    }
    return null;
  });
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
let pyProc;
app.whenReady().then(() =>
{
  createWindow();
  const backendPath = path.join(__dirname, '../RJBackend/rjbackend/rjbackend.exe');
  pyProc = spawn(backendPath, [], {
    stdio: ['pipe', 'pipe', 'pipe']
  });
  /*
  pyProc = spawn('python', [ path.join(__dirname, '../RJBackend/rjbackend.py')], {
    stdio: ['pipe', 'pipe', 'pipe']
  });
  */
  pyProc.stdout.on('data', (data) => {
    console.log(`PY: ${data}`);
  });

  pyProc.stderr.on('data', (data) => {
    console.error(`PY ERR: ${data}`);
  });

  pyProc.on('close', (code) => {
    console.log(`Python process exited with code ${code}`);
  });
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on('activate', () =>
  {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () =>
{
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
async function getMP3(rootFolder)
{
  const model = await onnx.InferenceSession.create(path.join(__dirname, '../Models/ONNX_DEAM.onnx'));

  console.log(model.inputMetadata);
  console.log("ONNX Model loaded successfully");

  const data = Float32Array.from({ length: (1 * 1 * 128 * 431) }, () => Math.random());
  const randInput = new onnx.Tensor("float32", data, [1, 1, 128, 431]);
  const output = await model.run({ input: randInput });
  console.log("Output:", output);
  let results = [];
  let foldersToScan = [rootFolder];

  while (foldersToScan.length > 0) {
    console.log("writing to pyproc");
    pyProc.stdin.write("can\r\n");
    const currentFolder = foldersToScan.pop();
    const files = fs.readdirSync(currentFolder, { withFileTypes: true });

    for (const file of files) {
      const fullPath = path.join(currentFolder, file.name);

      if (file.isDirectory()) {
        foldersToScan.push(fullPath);
      }

      else {
        /*
        try {
          //console.log(`Found MP3: ${metaData.common.title} by ${metaData.common.artist}`);
          const metaData = await md.parseFile(fullPath);
          console.log({
            path: fullPath,
            title: metaData.common.title || path.basename(file.name, ".mp3"),
            artist: metaData.common.artists || "Unknown Artist",
            album: metaData.common.album || "Unknown Album",
            duration: metaData.format.duration || 0,
          });
        } catch (err) {
          console.error(`Error reading metadata for ${fullPath}:`, err.message);
        }
          */
      }
    }
  }

  return results;
}


ipcMain.handle("scan-library", async () =>
{
  const folderPath = settings.musicDir;
  if (folderPath === undefined || folderPath === null || folderPath === "") {
    console.error("Invalid music directory");
    return [];
  }

  return getMP3(folderPath);
});

setTimeout(() =>
{
  const win = BrowserWindow.getAllWindows()[0];
  const toSend = [
    { title: "TestSong1", artist: "TestArtist1", src: "X:\\Music\\miwu.mp3" },
    { title: "TestSong2", artist: "TestArtist2", src: "mizu.mp3" },
    { title: "TestSong3", artist: "TestArtist3", src: "miwu.mp3" }
  ];
  win.webContents.send("library-updated", toSend);
}, 1000);
