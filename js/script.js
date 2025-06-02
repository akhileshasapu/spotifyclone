console.log("Let's write JavaScript");

let currentSong = new Audio();
let songs;
let currFolder;

function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) return "00:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

async function getSongs(folder) {
    currFolder = folder;
    console.log(`Fetching songs from folder: ${folder}`);
    try {
        let a = await fetch(`${folder}/`);
        let response = await a.text();
        let div = document.createElement("div");
        div.innerHTML = response;
        let as = div.getElementsByTagName("a");
        songs = [];

        for (let index = 0; index < as.length; index++) {
            const element = as[index];
            if (element.href.endsWith(".mp3")) {
                let path = new URL(element.href).pathname;
                let songName = decodeURIComponent(path.split(`${folder}/`)[1]);
                songs.push(songName);
            }
        }

        let songUL = document.querySelector(".songList ul");
        songUL.innerHTML = "";

        for (const song of songs) {
            songUL.innerHTML += `<li>
                <img class="invert" width="34" src="img/music.svg" alt="">
                <div class="info">
                    <div>${song.replaceAll("%20", " ")}</div>
                    <div>Harry</div>
                </div>
                <div class="playnow">
                    <span>Play Now</span>
                    <img class="invert" src="img/play.svg" alt="">
                </div>
            </li>`;
        }

        Array.from(songUL.getElementsByTagName("li")).forEach(e => {
            e.addEventListener("click", () => {
                playMusic(e.querySelector(".info div").innerText.trim());
            });
        });

    } catch (err) {
        console.error(`Error loading songs from ${folder}:`, err);
    }

    return songs;
}

function playMusic(track, pause = false) {
    console.log("Playing:", track);
    currentSong.src = `${currFolder}/${track}`;
    if (!pause) {
        currentSong.play();
        document.getElementById("play").src = "img/pause.svg";
    }
    document.querySelector(".songinfo").innerHTML = decodeURI(track);
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00";
}

async function displayAlbums() {
    console.log("Displaying albums...");
    try {
        let a = await fetch("songs/");
        let response = await a.text();
        let div = document.createElement("div");
        div.innerHTML = response;
        let anchors = div.getElementsByTagName("a");
        let cardContainer = document.querySelector(".cardContainer");

        let array = Array.from(anchors);
        for (let index = 0; index < array.length; index++) {
            const e = array[index];
            if (e.href.includes("/songs/") && !e.href.endsWith(".mp3")) {
                let path = new URL(e.href).pathname;
                let folder = decodeURIComponent(path.split("/songs/")[1].replace("/", ""));

                try {
                    let infoFetch = await fetch(`songs/${folder}/info.json`);
                    let albumInfo = await infoFetch.json();
                    console.log(`Loaded album info: ${albumInfo.title}`);

                    cardContainer.innerHTML += `
                        <div data-folder="${folder}" class="card">
                            <div class="play">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                                    xmlns="http://www.w3.org/2000/svg">
                                    <path d="M5 20V4L19 12L5 20Z" stroke="#141B34" fill="#000" stroke-width="1.5"
                                        stroke-linejoin="round" />
                                </svg>
                            </div>
                            <img src="songs/${folder}/cover.jpg" alt="">
                            <h2>${albumInfo.title}</h2>
                            <p>${albumInfo.description}</p>
                        </div>`;
                } catch (infoErr) {
                    console.warn(`Skipping folder '${folder}': info.json not found or malformed`, infoErr);
                }
            }
        }

        Array.from(document.getElementsByClassName("card")).forEach(e => {
            e.addEventListener("click", async item => {
                console.log(`Card clicked: ${item.currentTarget.dataset.folder}`);
                songs = await getSongs(`songs/${item.currentTarget.dataset.folder}`);
                playMusic(songs[0]);
            });
        });

    } catch (err) {
        console.error("Error loading album folders:", err);
    }
}

async function main() {
    await getSongs("songs/love-mood"); // ✅ Changed to safe folder name
    playMusic(songs[0], true);
    await displayAlbums();

    document.getElementById("play").addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play();
            document.getElementById("play").src = "img/pause.svg";
        } else {
            currentSong.pause();
            document.getElementById("play").src = "img/play.svg";
        }
    });

    currentSong.addEventListener("timeupdate", () => {
        let currentTimeStr = secondsToMinutesSeconds(currentSong.currentTime);
        let durationStr = secondsToMinutesSeconds(currentSong.duration);
        document.querySelector(".songtime").innerHTML = `${currentTimeStr} / ${durationStr}`;
        document.querySelector(".circle").style.left =
            (currentSong.currentTime / currentSong.duration) * 100 + "%";
    });

    document.querySelector(".seekbar").addEventListener("click", e => {
        let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
        document.querySelector(".circle").style.left = percent + "%";
        currentSong.currentTime = (currentSong.duration * percent) / 100;
    });

    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0";
    });

    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-120%";
    });

    document.getElementById("previous").addEventListener("click", () => {
        currentSong.pause();
        let index = songs.indexOf(decodeURIComponent(currentSong.src.split("/").pop()));
        if (index > 0) playMusic(songs[index - 1]);
    });

    document.getElementById("next").addEventListener("click", () => {
        currentSong.pause();
        let index = songs.indexOf(decodeURIComponent(currentSong.src.split("/").pop()));
        if (index < songs.length - 1) playMusic(songs[index + 1]);
    });

    document.querySelector(".range input")?.addEventListener("input", (e) => {
        currentSong.volume = parseInt(e.target.value) / 100;
        let volumeImg = document.querySelector(".volume > img");
        if (volumeImg && currentSong.volume > 0) {
            volumeImg.src = volumeImg.src.replace("mute.svg", "volume.svg");
        }
    });

    document.querySelector(".volume > img")?.addEventListener("click", e => {
        let volumeImg = e.target;
        let rangeInput = document.querySelector(".range input");
        if (volumeImg.src.includes("volume.svg")) {
            volumeImg.src = volumeImg.src.replace("volume.svg", "mute.svg");
            currentSong.volume = 0;
            if (rangeInput) rangeInput.value = 0;
        } else {
            volumeImg.src = volumeImg.src.replace("mute.svg", "volume.svg");
            currentSong.volume = 0.10;
            if (rangeInput) rangeInput.value = 10;
        }
    });
}

main();
