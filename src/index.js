import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { loadSettings, saveSettings } from './mini-store.js';
import electronSquirrelStartup from 'electron-squirrel-startup';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { parseFile } from 'music-metadata';
import { performance } from 'node:perf_hooks';
import Database from 'better-sqlite3'
import { encode } from 'node:punycode';

const __dirname = dirname(fileURLToPath(import.meta.url));
const settings = loadSettings();
let songs = [];

const musicDB = new Database(path.join(__dirname, '../music.db'));
//musicDB.pragma('journal_mode = WAL');
musicDB.prepare(`
    CREATE TABLE IF NOT EXISTS songs (
    title TEXT NOT NULL,
    artist TEXT NOT NULL,
    album TEXT NOT NULL,
    path TEXT NOT NULL,
    track INTEGER NOT NULL,
    arousal REAL DEFAULT 0.0,
    valence REAL DEFAULT 0.0,
    UNIQUE (title, artist, album, track)
  )
`).run();

let insertIntoDB = musicDB.prepare("INSERT INTO songs (title, artist, album, path, track, arousal, valence) VALUES (?, ?, ?, ?, ?, ?, ?)");
let isInDB = musicDB.prepare("SELECT * FROM songs WHERE title = ? AND artist = ? AND album = ? AND track = ?");

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


  mainWindow.webContents.on("did-finish-load", () =>
  {
    let x = musicDB.prepare("SELECT * FROM songs").all();
    //console.log(x);
    x.forEach(song =>
    {
      //console.log(`Title: ${song.title}, Artist: ${song.artist}, Album: ${song.album}, Path: ${song.path}`);
      songs.push({ title: song.title, artist: song.artist, album: song.album, src: song.path, track: song.track });
    });

    //console.log("Music library updated:", songs);
    const win = BrowserWindow.getAllWindows()[0];
    win.webContents.send("library-updated", songs);
  });

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
let backendStart = false;
let backendRdy = false;
let inpData = "";

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
  pyProc.stdout.on('data', (data) =>
  {
    data = data.toString().trim();
    if (data.endsWith("RDY")) {
      console.log("Backend ready");
      backendStart = true;
      return;
    }

    if (data.endsWith("OK")) {
      backendRdy = true;
    }
    inpData += data;
    //console.log(`PY: ${data}`);
  });

  pyProc.stderr.on('data', (data) =>
  {
    console.error(`PY ERR: ${data}`);
  });

  pyProc.on('close', (code) =>
  {
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
  let results = [];
  let foldersToScan = [rootFolder];
  let totalTime = 0;

  let startTime = performance.now();
  while (foldersToScan.length > 0) {
    const currentFolder = foldersToScan.pop();
    const files = fs.readdirSync(currentFolder, { withFileTypes: true });

    for (const file of files) {
      const fullPath = path.join(currentFolder, file.name);

      if (file.isDirectory()) {
        foldersToScan.push(fullPath);
      }

      else {
        try {
          //console.log(`Found MP3: ${metaData.common.title} by ${metaData.common.artist}`);
          const metaData = await parseFile(fullPath);
          /*
          console.log({
            path: fullPath,
            title: metaData.common.title || path.basename(file.name, ".mp3"),
            artist: metaData.common.artists || "Unknown Artist",
            album: metaData.common.album || "Unknown Album",
            duration: metaData.format.duration || 0,
          });
          */
          let title = metaData.common.title || path.basename(file.name);
          let artist = metaData.common.artists ? metaData.common.artists.join("/") : "Unknown Artist";
          let album = metaData.common.album || "Unknown Album";
          let track = metaData.common.track ? metaData.common.track.no : 0;
          console.log();
          if (isInDB.get(title, artist, album, track) !== undefined) {
            //already in, populate from database
            const row = isInDB.get(title, artist, album, track);
            console.log(`Skipping ${title} by ${artist} from album ${album}, already in database.`);
          }

          else {
            backendRdy = false;
            pyProc.stdin.write(`S${fullPath}\r\n`);
            totalTime += metaData.format.duration || 0;
            while (backendRdy === false) {
              await new Promise(resolve => setTimeout(resolve, 100));
            }

            let [arousal, valence] = inpData.split(' ').map(s => parseFloat(s));
            //const [arousal, valence] = inpData.split(' ').map(Number);
            console.log(metaData.common.title);
            console.log("Arousal: ", arousal, "Valence: ", valence);
            try {
              insertIntoDB.run(title, artist, album, fullPath, track, arousal, valence);
            } catch (err) {
              console.error(`Error inserting into database for ${title} by ${artist}:`, err.message);
            }
            inpData = "";

            songs.push({ title: title, artist: artist, album: album, src: fullPath, track: track });
          }
        }

        catch (err) {
          console.error(`Error reading metadata for ${fullPath}:`, err.message);
        }
      }
    }
  }
  let endTime = performance.now();
  console.log("Scan complete");
  console.log(`Total scan time: ${endTime - startTime} ms`);
  console.log(`Scanned ${totalTime} seconds of audio`);

  //console.log("Pushing");
  //console.log(songs);
  const win = BrowserWindow.getAllWindows()[0];
  win.webContents.send("library-updated", songs);
  //return results;
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

