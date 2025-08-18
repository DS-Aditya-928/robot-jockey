const playlist = document.getElementById("playlist");
const audio = document.getElementById("audio");
const playPauseBtn = document.getElementById("playPause");
const playIcon = document.getElementById("playIcon");
const pauseIcon = document.getElementById("pauseIcon");
const nextBtn = document.getElementById("next");
const prevBtn = document.getElementById("prev");
const songInput = document.getElementById("songInput");
const selectPathBtn = document.getElementById("selectPath");
const scanBtn = document.getElementById("scanLibrary");
const libraryList = document.getElementById("libraryList");

let songs = [];
let currentIndex = 0;
let isPlaying = false;

function highlightSong()
{
    [...playlist.children].forEach((li, i) =>
    {
        li.classList.toggle("active", i === currentIndex);
    });

    [...libraryList.children].forEach((li, i) =>
    {
        li.classList.toggle("active", i === currentIndex);
    });
}

function loadSong(index)
{
    if (!songs[index]) return;
    audio.src = "file:///X:/Downloads/miwu.mp3";
    audio.play();
    currentIndex = index;
    highlightSong();
    isPlaying = true;
    updatePlayPause();
}

function updatePlayPause()
{
    if (isPlaying) {
        playIcon.style.display = "none";
        pauseIcon.style.display = "block";
    } else {
        playIcon.style.display = "block";
        pauseIcon.style.display = "none";
    }
}

playPauseBtn.addEventListener("click", () =>
{
    if (!audio.src) {
        loadSong(currentIndex);
    } else if (isPlaying) {
        audio.pause();
        isPlaying = false;
        updatePlayPause();
    } else {
        audio.play();
        isPlaying = true;
        updatePlayPause();
    }
});

nextBtn.addEventListener("click", () =>
{
    currentIndex = (currentIndex + 1) % songs.length;
    loadSong(currentIndex);
});

prevBtn.addEventListener("click", () =>
{
    currentIndex = (currentIndex - 1 + songs.length) % songs.length;
    loadSong(currentIndex);
});

playlist.addEventListener("click", (e) =>
{
    if (e.target.closest("li")) {
        const index = e.target.closest("li").dataset.index;
        loadSong(Number(index));
    }
});

songInput.addEventListener("keypress", (e) =>
{
    if (e.key === "Enter" && songInput.value.trim()) {
        songInput.value = "";
    }
});

audio.addEventListener("ended", () =>
{
    currentIndex = (currentIndex + 1) % songs.length;
    loadSong(currentIndex);
});

window.electronAPI.onPlaylistUpdate((newPlaylist) =>
{
    songs = newPlaylist;
    renderPlaylist(playlist, newPlaylist);
});

window.electronAPI.onLibraryUpdate((newLibrary) =>
{
    songs = newLibrary;
    renderPlaylist(libraryList, newLibrary);
});

updatePlayPause();

// ---- New Nav Switching Code ----
const homeView = document.getElementById("homeView");
const manageView = document.getElementById("manageView");
const navHome = document.getElementById("nav-home");
const navManage = document.getElementById("nav-manage");

navHome.addEventListener("click", () =>
{
    homeView.style.display = "block";
    manageView.style.display = "none";
});

navManage.addEventListener("click", () =>
{
    homeView.style.display = "none";
    manageView.style.display = "block";
});

let selectedFolder = null;

selectPathBtn.addEventListener("click", async () =>
{
    const folder = await window.electronAPI.selectPath();
    if (folder) {
        selectedFolder = folder;
        console.log("Selected folder: " + folder);
    }
});

scanBtn.addEventListener("click", async () =>
{
    const songs = await window.electronAPI.scanLibrary();

    libraryList.innerHTML = songs.map(song => `<li>${song.title} - ${song.artist}</li>`).join("");
});