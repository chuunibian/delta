# Delta

![Windows](https://img.shields.io/badge/Windows-0078D6?style=for-the-badge&logo=windows&logoColor=white)
![Linux](https://img.shields.io/badge/Linux-FCC624?style=for-the-badge&logo=linux&logoColor=black)

A disk space analyzer that allows a more streamlined view of a computer's disks with the capability to compare current scans to previous saved scans for size comparisons.

![Delta Project Screenshot](images/deltademo.gif)

## Example Usage

- Select and scan desired current disk and have the option to save the snapshot which is identified by date and drive name.
- If there are previous stored snapshots then you can compare with previous a snapshot.
- The comparison will then for every file system entry show the size difference or the absense or inclusion of a file system entry.

## Features

- **Scan Comparisons:** Save snapshots of your disk state and compare current scans to previous ones. Allows user to identify which folders have grown in size.
- **Local & Private:** Runs 100% offline. No telemetry, no cloud uploads.
- **Lightweight:** Built with Rust and Tauri for a lightweight install and run footprint.

## Downloads & Install

### Through Release

1. Visit **[Releases Page](https://github.com/chuunibian/delta/releases)**
2. Download latest `.msi` or `.exe` file.
3. Run the installer

### Build From Source

1. Have **Rust** and **Node.js** installed.
2. Clone repo:
   ```bash
   git clone [https://github.com/chuunibian/delta.git](https://github.com/chuunibian/delta.git)
   cd delta
   ```
3. Install deps and run:
   ```bash
   npm install
   npm run tauri build
   ```

## Tech stack

- **Core:** [Tauri](https://tauri.app/) (Rust)
- **Frontend:** React + Vite
- **Persistent Storage:** SQLite

## Future Plans With Comments

- [ ] Performance Changes
  - The memory footprint currently I think is "ok" however I think there are better approaches that are easily implementable which don't change speed of app.
  - The scan speed is not very fast since it is a naive implementation of a recursive algorithm making make many sys calls.
  - Pooling Sqlite connections. Currently for each lazy loaded request from frontend, the backend does not keep one sqlite connection and uses it for every request. I think since the app is local to 1 user this is "ok" but not ideal.
- [ ] More visual features
  - There is a 3rd card not used which I planned to maybe put some graph that showed the changes of a selected file over all snapshots with that same letter with x-axis being sorted date.
  - Also other visual components can also be added.
- [ ] Managing Incorrect Assumptions About Disks
  - For Windows the app currently categorizes snapshots by the letter aliase which is sorta wrong because Windows can change that letter for many reasons so some more OS native name for the disk should be the actual identifier of snapshots.
- [ ] Adding Intelligence To Diffing
  - The diff between 2 snapshots is not smart in anyway, for example in Folder "A" if it contains a folder "B" that was renamed then it will recognize that folder as "new" (However if the overall size of the folder "B" didnt change) then Folder "A" size will reflect the reality. I think a way to make it so it doesnt flag new is to add some huersitics.

## Contributing & Feedback

This project was built out of curiousity to learn and apply rust in a utility project. I find disk space analyzers useful for when my drives are running low on space or just investigating available space flucuations, but I felt without the ability to compare to previous scans, it takes much longer to find big changes. This application is fully self-contained. It requires no internet connection to function and does not send any telemetry or usage data to external servers. The project is open source and will stay so.

## License

MIT License - see [LICENSE](LICENSE) for details.
