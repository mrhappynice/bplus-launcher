# bplus🤷‍♂️️ launcher🚀️

A simple, self-hosted desktop app launcher built with Rust and vanilla JS. 
It allows you to configure commands (like Docker containers or shell scripts) and provides a UI to launch them and open their web interfaces. Plus, useful terminal mesasges.

Launch cards for bplus🤷‍♂️️ series of apps, docker containers, and other system utilities. Install, launch, manage WIP* added: [Cnidarian](https://github.com/mrhappynice/cnidarian), [streamdlrs-gui](https://github.com/mrhappynice/bplus-streamdlrs-gui), and [searchrs](https://github.com/mrhappynice/bplus-searchrs) cards *Life Manager added [lifeman](https://github.com/mrhappynice/lifeman)

## Quick Start🏁
*Assumes git, docker, ffmpeg, unzip, general utilities installed. For termux pip install yt-dlp for usage. Also pkg install llama-cpp. Adding to json file(working on full termux auto-install script) linux binary compiled for glibc 2.35+ (ex. Ubuntu 22+) 

- ```sh 
  curl -fsSL https://raw.githubusercontent.com/mrhappynice/bplus-launcher/main/install.sh | bash
  ```
  enter ```bplus-launcher``` folder and run: ```./bplus-launcher``` - click Launch on the get bplus apps card for auto install of the cards mentioned above.

  Termux bin for android install:
- ```sh
  curl -fsSL https://raw.githubusercontent.com/mrhappynice/bplus-launcher/main/termux-install.sh | bash
  ```
- No windows specific json file yet(modify availble or create your own), .exe file in Releases. (how to detach from terminal like linux command?, tried single line powershell through cmd command. no quotes to avoid issues. freezes launcher until app close. trying to fix without rs rewrite for win)

## Prerequisites

- [Rust](https://www.rust-lang.org/tools/install) installed. My dev-con image to build this and other projects is available in the repo and on [MHN Docker Hub](https://hub.docker.com/u/mrhappynice)
- WIP compiled binaries in Releases section

## Setup & Run

1. **Build the backend:**
   ```bash
   chmod +x build.sh && ./build.sh
   ```
   ```bash
   cargo build --release
   ```
3. **Run:**
   ```sh
   ./bplus-launcher
   ```
4. **Open in browser:**
   http://localhost:5660

Examples in apps.json, you can use the Add Apps button in UI.
