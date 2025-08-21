function renderPlaylist(l, songsNew)
{

    const curHTML = libraryList.querySelector(`li[data-index="${currentIndex}"]`);

    if (curHTML) {
        console.log(`current playing: ${curHTML.innerHTML}`);
    }
    l.innerHTML = "";

    songsNew.sort((a, b) =>
    {
        const artistCmp = a.artist.split("/")[0].localeCompare(b.artist.split("/")[0]);
        if (artistCmp !== 0) return artistCmp;

        const albumCmp = a.album.localeCompare(b.album);
        if (albumCmp !== 0) return albumCmp;
        return a.track - b.track;
    });
    let globalIndex = 0;
    songsNew.forEach((song, i) =>
    {
        const li = document.createElement("li");
        li.innerHTML = `<li class="song-item">
        <span class="title">${song.title}</span>
        <span class="album">${song.album}</span>
        <span class="artist">${song.artist}</span>
        </li>`;
        if (l.textContent.includes(`>${li.textContent}<`)) {
            console.log(`Skipping duplicate song: ${song.title} by ${song.artist}`);
            return;
        }

        if (curHTML) {
            if (li.innerHTML === curHTML.innerHTML) {
                li.classList.add("active");
                currentIndex = globalIndex;
            }
        }

        else if (globalIndex == 0) {
            li.classList.add("active");
        }

        li.dataset.index = globalIndex;
        const index = globalIndex;
        li.addEventListener("click", () =>
        {
            loadSong(index);
            console.log(`Loading song at index: ${index}`);
        });
        l.appendChild(li);
        songs.push(song);
        globalIndex++;
    });
    //console.log(l.innerHTML);
    return (songsNew);
}