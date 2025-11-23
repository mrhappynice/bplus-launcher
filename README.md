# bplus🤷‍♂️️ launcher🚀️

A simple, self-hosted desktop app launcher built with Rust and vanilla JS. 
It allows you to configure commands (like Docker containers or shell scripts) and provides a UI to launch them and open their web interfaces. Plus, useful terminal mesasges.

Launch cards for bplus🤷‍♂️️ series of apps. Install, launch, manage WIP* added: Cnidarian, streamdlrs-gui, and searchrs

## Quick Start🏁

- ```sh 
  curl -fsSL https://raw.githubusercontent.com/mrhappynice/bplus-launcher/main/install.sh | bash
  ```
  enter ```bplus-launcher``` folder and run: ```./bplus-launcher``` - click get bplus apps for auto install

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
   Or just get the compiled binary, for Ubuntu 22+(glibc 2.35+):
   ```sh
   chmod +x get-bin.sh && ./get-bin.sh
   ```
3. **Run:**
   ```sh
   ./bplus-launcher
   ```
4. **Open in browser:**
   http://localhost:5660

Examples in apps.json, you can use the Add Apps button in UI.
