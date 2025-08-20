let globalIndex = 0;


function renderPlaylist(l, songsNew)
{
    //l.innerHTML = "";
    console.log(`current state: ${l.textContent}`);

    songsNew.forEach((song, i) =>
    {
        const li = document.createElement("li");
        li.innerHTML = `${song.title} <span>${song.artist}</span>`;
        if(l.textContent.includes(li.textContent)) {
            return;
        }
        li.dataset.index = globalIndex;
        if (globalIndex === currentIndex) li.classList.add("active");
        const index = globalIndex;
        li.addEventListener("click", () => {
            loadSong(index);
            console.log(`Loading song at index: ${index}`);
        });
        l.appendChild(li);
        songs.push(song);
        globalIndex++;
    });
}