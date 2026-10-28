# Security & Reliability Review — `perf-fixes` branch

Review date: 2026-08-18
Scope: `src-tauri/src/database.rs`, `disk.rs`, `fs_commands.rs`, `model.rs` (staged changes),
plus follow-up hardening applied to `src-tauri/tauri.conf.json` and
`src-tauri/capabilities/default.json`

## Issues found and fixed

### 1. High — Path traversal in snapshot delete (`database.rs`)

**Before:** `delete_snapshot_file` built a file path by directly joining unvalidated,
frontend-supplied `selected_row_file_name` onto the snapshot directory
(`tempsnapshot/{name}.db`) and passed it straight to `fs::remove_file`. A crafted
name such as `....\..\..\somefile` could resolve outside the snapshot directory,
allowing arbitrary file deletion within the privilege boundary of the app.

**Fix:**
- Added `validate_snapshot_stem()` — allowlists the stem to ASCII
  alphanumerics, `_`, and `-` only (matches the `{drive}_{yyyyMMddHHmm}_{size}`
  format snapshot files are actually generated with in `write_current_tree`),
  rejecting anything else outright rather than trying to blacklist known-bad
  characters.
- Added `snapshot_dir_path()` / `snapshot_db_path()` helpers used consistently by
  every command that resolves a snapshot file (`query_stats_from_id`,
  `query_children_stats_from_parent_id`, `write_current_tree`,
  `get_local_snapshot_files`, `delete_snapshot_file`) instead of each building the
  path inline.
- `delete_snapshot_file` additionally canonicalizes both the resolved target and
  the snapshot directory and verifies `canonical_target.starts_with(canonical_snapshot_dir)`
  before deleting — defense against symlink-based escapes even if a bad name
  somehow got past the whitelist check.

**Residual risk (accepted):** a theoretical TOCTOU window exists between the
canonicalize check and `remove_file` (a file could be swapped for a symlink in
between). Not treated as exploitable: an actor able to write into the app's own
`tempsnapshot` directory already runs at the same privilege level as the user and
gains nothing by racing this call.

### 2. Reliability — Panics on missing/poisoned state (`disk.rs`, `fs_commands.rs`)

**Before:** Several commands called `.unwrap()` on `Option`/`Mutex::lock()`
results (`state.local_appdata_path.unwrap()`, `state.file_tree.lock().unwrap()`).
A poisoned mutex or missing app-data path would panic the backend thread instead
of surfacing a typed error to the frontend.

**Fix:** Replaced all such `.unwrap()` calls with proper error propagation:
- `disk_scan` and `query_new_dir_object` now map a poisoned lock to
  `AppError::GeneralLogicalErr` instead of panicking.
- `get_snapshot_storage_path` and the new `snapshot_dir_path()` helper return
  `AppError::StartupError` when `local_appdata_path` is unset instead of
  unwrapping.

### 3. Performance — Long-held global lock during snapshot writes (`database.rs`, `disk.rs`)

**Before:** `write_current_tree` and `query_new_dir_object` held the global
`file_tree` mutex for the entire duration of the SQLite write / subtree walk,
serializing all backend commands behind slow IO.

**Fix:** Both functions now clone only what they need (root node / requested
subtree) inside a short-lived lock scope, then release the mutex before doing
IO-heavy work (DB writes, diffing).

### 4. Performance — Unbounded historical-data scan (`database.rs`)

**Before:** `get_path_historical_data` and `get_local_snapshot_files` iterated
every file in the snapshot directory regardless of extension, and
`get_path_historical_data` queried every snapshot DB regardless of which disk/root
it belonged to.

**Fix:** Both now filter to `.db` files only, and `get_path_historical_data`
additionally filters to snapshot files matching the requested drive/root name
(via `clean_disk_name`) before opening and querying each database.

### 5. Medium — CSP disabled + broad `opener` capability (`tauri.conf.json`, `capabilities/default.json`)

**Before:** `src-tauri/tauri.conf.json` had `"security": { "csp": null }`
(no content security policy at all), and `capabilities/default.json` granted
`opener:default`, which enables every command the opener plugin exposes
(`open_path`, `open_url`, `reveal_item_in_dir`, arbitrary default-URL handling).
The frontend only actually calls `revealItemInDir` (`src/components/overview-tab.tsx`).
If any content injection ever landed in the webview, the null CSP plus the
over-broad opener grant would meaningfully raise the blast radius (arbitrary
external navigation/open of attacker-chosen paths or URLs).

**Fix:**
- Set an explicit CSP in `tauri.conf.json`:
  `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' asset: https://asset.localhost data:; connect-src 'self' ipc: http://ipc.localhost`.
  This blocks loading/executing any remote script and restricts network/asset
  origins to the app itself and Tauri's own IPC/asset schemes. `style-src`
  keeps `'unsafe-inline'` since the UI relies on inline styles (chart/tree
  components) that would otherwise break — this is a much lower-risk relaxation
  than allowing inline script.
- Narrowed the opener capability from `opener:default` to
  `opener:allow-reveal-item-in-dir` — the only opener action the app actually
  uses — in `capabilities/default.json`.

## Known issues not addressed in this branch (tracked separately)

- **Low — TOCTOU window in `delete_snapshot_file`.** There is a small gap between
  the canonicalize/`starts_with` check and the `fs::remove_file` call — a file
  could theoretically be swapped for a symlink in that window. Not fixed because
  it isn't concretely exploitable: an attacker able to write into the app's own
  `tempsnapshot` folder already runs at the same privilege level as the user, so
  winning the race doesn't grant any capability they don't already have. Flagged
  here for visibility rather than acted on.

- **Pre-existing, out of scope for this diff — `clean_disk_name` (`platform/windows.rs`,
  `platform/linux.rs`).** `write_current_tree` and `get_path_historical_data`
  build snapshot filenames from a disk/root name cleaned by this function. It
  was not modified or audited as part of this review since it's unchanged by
  the staged diff; worth a dedicated look if the disk/root name is ever
  attacker-influenced rather than OS-supplied.
