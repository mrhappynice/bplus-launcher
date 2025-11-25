# bplus🤷‍♂️️ launcher🚀️

A simple, self-hosted desktop app launcher built with Rust and vanilla JS. 
It allows you to configure commands (like Docker containers or shell scripts) and provides a UI to launch them and open their web interfaces. Plus, useful terminal mesasges.

Launch cards for bplus🤷‍♂️️ series of apps, docker containers, and other system utilities. Install, launch, manage WIP* added: [Cnidarian](https://github.com/mrhappynice/cnidarian), [streamdlrs-gui](https://github.com/mrhappynice/bplus-streamdlrs-gui), and [searchrs](https://github.com/mrhappynice/bplus-searchrs) cards

## Quick Start🏁

- ```sh 
  curl -fsSL https://raw.githubusercontent.com/mrhappynice/bplus-launcher/main/install.sh | bash
  ```
  enter ```bplus-launcher``` folder and run: ```./bplus-launcher``` - click get bplus apps for auto install

  Termux install:
- ```sh
  curl -fsSL https://raw.githubusercontent.com/mrhappynice/bplus-launcher/main/termux-install.sh | bash
  ```

## Prerequisites

- [Rust](https://www.rust-lang.org/tools/install) installed. dev-con is also available here and on [MHN Docker Hub](https://hub.docker.com/u/mrhappynice)
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
