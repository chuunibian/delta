# Delta

![Windows](https://img.shields.io/badge/Windows-0078D6?style=for-the-badge&logo=windows&logoColor=white)
![Linux](https://img.shields.io/badge/Linux-FCC624?style=for-the-badge&logo=linux&logoColor=black)

A disk space analyzer built with Rust and Tauri. Instead of just showing you what is on your drive right now, Delta lets you save snapshots of your disk state and compare them over time to see exactly which files and folders are eating up your space.

![Delta Project GIF](images/demogif2.gif)

You can also view the high-quality demo video below:

https://github.com/user-attachments/assets/10722d41-1676-4030-86d9-0173415e87d5

## How to Use Delta

1. **Run a Baseline Scan:** If you are a new user, there will not be any previously saved snapshots. Select your target drive from the dropdown menu and select "Save snapshot" to initiate a scan. This will display your current storage distribution and save the scan as a snapshot. Snapshots are automatically tagged with their disk name and capture date.

2. **Waiting Time:** Wait a few days, weeks, or any desired unit of time.

3. **Compare & Diff:** Select your target drive to scan, then select your previously saved snapshot file to compare against. Check the "Compare snapshots" box and click "Scan". Delta will display the size differences for directory entries, as well as any new subdirectories and files.

> **Note:** Delta does not run autonomously in the background. It relies entirely on the user to manually trigger and save scans to build data for snapshot history. For new app installations there will not be much historical data.

**Understanding the Results:**
- **Green numbers:** The directory/file has **fewer bytes** than in the previous scan.
- **Red numbers:** The directory/file has **more bytes** than in the previous scan.
- **Grey numbers:** There was **no change** in size.

## Comparing Two Saved Snapshots

Besides comparing a live scan to one previous snapshot, you can diff any two saved snapshots directly against each other — useful for looking back at how a drive changed between two specific points in time without rescanning it.

1. From the start screen, open the **Compare Snapshots** tab.
2. Pick a **Base snapshot** and a **Compare against** snapshot from your saved history.
3. Click **Compare**. Delta loads both snapshots and shows the diff in the same tree view used for live scans — new/deleted/changed entries are highlighted the same way.

> Snapshots taken before this feature was added don't carry the metadata needed to be loaded this way — take a fresh snapshot to use them in a two-snapshot compare.

## Features

- **Scan Comparisons:** Save snapshots of your disk state and compare current scans to previous ones. Allows user to identify which folders or files have grown in size.
- **Snapshot vs. Snapshot Compare:** Diff any two saved snapshots against each other, not just live scan vs. one snapshot.
- **Local & Private:** Runs 100% offline. No telemetry, no cloud uploads. Data is stored 100% locally.
- **Lightweight:** Built with Rust and Tauri for a lightweight install and run footprint.
- **Portable Snapshots:** Snapshot node identity is based on the path relative to the scanned drive/folder, so a snapshot copied to another machine (different username, different drive letter) still compares correctly instead of reading as "all new."

## Downloads & Install

### Through Release

1. Visit **[Releases Page](https://github.com/chuunibian/delta/releases)**
2. Download latest `.msi` or `.exe` or matching linux installation file.
3. Run the installer

> This application is not digitally signed. 
> * **Windows:** You may see a Windows protected your PC (SmartScreen) popup. Click **More info** > **Run anyway**.
> * **Linux:** Your package manager may warn you about an **unsigned package**.

### Build From Source

1. Have **Rust** and **Node.js** installed.
2. Clone repo:
   ```bash
    git clone https://github.com/chuunibian/delta.git
    cd delta
   ```
3. Install deps and run for app build:
   ```bash
    npm install
    npm run tauri build
   ```
   or for dev build
   ```bash
    npm install
    npm run tauri dev
   ```

### Portable Version

Delta can run with no installer and no data written outside its own folder — copy the app folder anywhere (a USB stick, another PC) and it keeps working.

To run portably, either:
- Place a `data` folder next to the Delta executable, or
- Place an empty `portable.txt` file next to the Delta executable.

On startup, Delta detects either marker and stores all snapshots under `data/tempsnapshot` next to the executable instead of your OS's app-data directory. If that folder turns out not to be writable (e.g. the app is running from a read-only location), Delta automatically falls back to the normal OS app-data directory instead of failing to start.

> Portable mode only changes *where* snapshots are stored. Build/packaging still produces the normal installers described above — running portably just means dropping the built executable (plus the marker) into its own folder rather than installing it.

## Tech stack

- **Core:** [Tauri](https://tauri.app/) (Rust)
- **Frontend:** React
- **Persistent Storage:** SQLite

## Roadmap & Known Limitations

**Performance & Architecture**
- **Scan Optimization:** Transition away from the current recursive scanning algorithm to minimize system calls and significantly improve file tree traversal speeds.
- **Memory Management:** Refactor internal data structures to further reduce the application's memory footprint during massive disk scans.

**Diffing Engine Enhancements**
- **Intelligent Diffing Heuristics:** Upgrade the diffing algorithm to detect renamed directories. Currently, a renamed folder is flagged as a "deleted" and "new" entry. Adding size and content heuristics will allow the engine to track renamed folders accurately without skewing the diff reality.

**OS Integration**
- **Robust Disk Identification (Windows):** Migrate away from categorizing snapshots by drive letter aliases (e.g., `C:\`, `D:\`), as these can be reassigned by the OS. Transition to using persistent, OS-native volume identifiers to ensure snapshots remain accurately linked to their physical drives over time.

**Data Visualization**
- **Largest Files Table:** Implement a table showing largest files.
- **TreeMap** Implement a tree map similar to how classic disk space analyzers have with the file tree changing with the tree map.
- **FileType** Implement basic radar graph showing distrib of top k file types on disk.

**Option To Preview Snapshots**
- **Preview:** Allow user to load a snapshot and preview it as if it was just scanned.

**Option To Export/Import Snapshots Into User Designated Space**
- **Exporting:** Allow users to export all current snapshots to a user safe space. This can be used to archive scan data and import them in when more data points are needed. 

## Contributing & Feedback

Contributions, issues, feedback, and feature requests are highly welcome. For bug reports, please open an issue on GitHub. For feature requests, please open a discussion on GitHub. For contributions, please open a pull request.

## Comments

This project was built out of curiosity to learn and apply rust in a utility project. I find disk space analyzers useful for when my drives are running low on space or just investigating disk space fluctuations, but I felt without the ability to compare to previous scans, it takes much longer to find some changes. The project is open source and will always stay so.

## License

MIT License - see [LICENSE](LICENSE) for details.
