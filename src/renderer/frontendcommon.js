function renderPlaylist(l, songs)
{
    l.innerHTML = "";
    songs.forEach((song, i) =>
    {
        const li = document.createElement("li");
        li.innerHTML = `${song.title} <span>${song.artist}</span>`;
        li.dataset.index = i;
        if (i === currentIndex) li.classList.add("active");
        l.appendChild(li);
    });
}