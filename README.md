# Delta

![Windows](https://img.shields.io/badge/Windows-0078D6?style=for-the-badge&logo=windows&logoColor=white)
![Linux](https://img.shields.io/badge/Linux-FCC624?style=for-the-badge&logo=linux&logoColor=black)

A disk space analyzer built with Rust and Tauri. Instead of just showing you what is on your drive right now, Delta lets you save snapshots of your disk state and compare them over time to see exactly which files and folders are eating up your space.

![Delta Project GIF](images/deltademo.gif)

You can also view the high-quality demo video below:

https://github.com/user-attachments/assets/bde3a976-603c-4fb8-afea-cb32681cb6f3

## How to Use Delta

1. **Run a Baseline Scan:** If you are a new user, there will not be any previously saved snapshots. Select your target drive from the dropdown menu and select "Save snapshot" to initiate a scan. This will display your current storage distribution and save the scan as a snapshot. Snapshots are automatically tagged with their disk name and capture date.

2. **Waiting Time:** Wait a few days, weeks, or any desired unit of time.

3. **Compare & Diff:** Select your target drive to scan, then select your previously saved snapshot file to compare against. Check the "Compare snapshots" box and click "Scan". Delta will display the size differences for directory entries, as well as any new subdirectories and files.

**Understanding the Results:**
- **Green numbers:** The directory/file has **fewer bytes** than in the previous scan.
- **Red numbers:** The directory/file has **more bytes** than in the previous scan.
- **Grey numbers:** There was **no change** in size.

## Features

- **Scan Comparisons:** Save snapshots of your disk state and compare current scans to previous ones. Allows user to identify which folders have grown in size.
- **Local & Private:** Runs 100% offline. No telemetry, no cloud uploads. Data is stored 100% locally.
- **Lightweight:** Built with Rust and Tauri for a lightweight install and run footprint.

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
3. Install deps and run:
   ```bash
    npm install
    npm run tauri build
   ```

## Tech stack

- **Core:** [Tauri](https://tauri.app/) (Rust)
- **Frontend:** React
- **Persistent Storage:** SQLite

## Roadmap & Known Limitations

**Performance & Architecture**
- **Scan Optimization:** Transition away from the current recursive scanning algorithm to minimize system calls and significantly improve file tree traversal speeds.
- **Database Connection Pooling:** Implement connection pooling for SQLite.
- **Memory Management:** Refactor internal data structures to further reduce the application's memory footprint during massive disk scans.

**Diffing Engine Enhancements**
- **Intelligent Diffing Heuristics:** Upgrade the diffing algorithm to detect renamed directories. Currently, a renamed folder is flagged as a "deleted" and "new" entry. Adding size and content heuristics will allow the engine to track renamed folders accurately without skewing the diff reality.

**OS Integration**
- **Robust Disk Identification (Windows):** Migrate away from categorizing snapshots by drive letter aliases (e.g., `C:\`, `D:\`), as these can be reassigned by the OS. Transition to using persistent, OS-native volume identifiers to ensure snapshots remain accurately linked to their physical drives over time.

**Data Visualization**
- **Historical Trend Graphs:** Implement a third UI card dedicated to plotting the historical size changes of a specifically selected file or directory across all available snapshots over time.

## Contributing & Feedback

Contributions, issues, feedback, and feature requests are highly welcome. For bug reports, please open an issue on GitHub. For feature requests, please open a discussion on GitHub. For contributions, please open a pull request.

## Comments

This project was built out of curiosity to learn and apply rust in a utility project. I find disk space analyzers useful for when my drives are running low on space or just investigating disk space fluctuations, but I felt without the ability to compare to previous scans, it takes much longer to find some changes. The project is open source and will always stay so.

## License

MIT License - see [LICENSE](LICENSE) for details.
