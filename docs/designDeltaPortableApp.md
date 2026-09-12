# Design: Portable Delta + Portable, Comparable Snapshots

Status: **implemented in the backend** (parts A–D below all landed in
`src-tauri`). Frontend UI to pick two snapshots and call the new
`compare_two_snapshots` command is not wired up yet.
Author context: written from a review of `src-tauri/src/{disk,database,model}.rs`
Related: [docs/security-review-perf-fixes.md](./security-review-perf-fixes.md)

## Goal

Two related asks:

1. **No-install, portable app.** Delta should run from a USB stick / a single
   folder copied anywhere, with no installer and no data written outside that
   folder (or, at minimum, no *requirement* that it write outside that folder).
2. **Portable, comparable snapshots.** A snapshot `.db` file should be a
   self-contained artifact you can copy to another machine (or another user's
   profile on the same machine) and still get a meaningful diff — not "everything
   looks new" — and it should be possible to compare *two saved snapshots*
   against each other, not just "live scan vs. one snapshot."

These are coupled: making the app portable is mostly a storage-location problem;
making snapshots portable is an identity + schema problem. Both are needed for
"copy the whole Delta folder to another machine and keep working."

## Current state (why it doesn't work today)

### 1. Snapshot storage is installation-coupled

`snapshot_dir_path()` (`database.rs:21`) always resolves to
`local_appdata_path.join("tempsnapshot")`, and `local_appdata_path` comes from
Tauri's OS-managed local-app-data directory. That directory is:
- OS/user specific (`%LOCALAPPDATA%\...` on Windows, tied to the current user),
- not next to the executable, so copying the app folder elsewhere does not bring
  snapshots with it, and
- not guaranteed writable-and-portable (Program Files style installs restrict it).

### 2. The node ID is a hash of the full absolute path

`hash_path_id()` (`disk.rs:14`) is called with `entry.path().to_string_lossy()`
— the **full absolute filesystem path**, e.g.
`C:\Users\Alice\Documents\Photos`. That hash becomes the row's primary key in
the snapshot DB (`database.rs:201`, the `snapshot` table's `id`/`parent_id`).

This means identity is accidentally scoped to:
- the drive letter / mount point,
- **the OS username** (anything under `C:\Users\<name>\...`), and
- the exact absolute path string.

Copy a snapshot to a machine where the user is `Bob` instead of `Alice` (or
even just a different Windows profile on the same machine), and every path
under the home directory hashes to a completely different ID. The diff engine
then can't match old rows to new nodes at all — everything reads as new/deleted
instead of "same content, different owner." This is the exact bug you
described.

### 3. The DB doesn't store enough to be self-contained

The `snapshot` table only stores `id, size, dir_flag, sub_folder_count,
sub_file_count, parent_id` — no `name`. That's fine for the current use case
(diffing against a *live* tree, which already has names), but it means a
snapshot `.db` file **cannot be turned back into a `Dir` tree on its own** — there's
no way to reconstruct `subdirs`/`files` keyed by name, or even print a path,
from the DB alone. This is why "load a snapshot into memory" isn't possible
today without also having the machine that produced it re-scan the disk.

### 4. No two-snapshot compare

`get_subdir_and_files()` (`model.rs:219`) and its counterparts always diff a
live in-memory `Dir` against exactly one snapshot DB, looked up by ID. There's
no code path that takes two DB files and diffs them against each other,
because there's no way to materialize a `Dir` from a DB file per point 3.

## Design

### A. Portable storage location

Add a small resolution step at startup, done once when `BackendState` is built:

1. Compute `exe_dir` = the directory containing the running executable
   (`std::env::current_exe()?.parent()`).
2. If `exe_dir.join("data")` exists, **or** a `portable.txt`/`portable` marker
   file exists next to the executable, treat this as portable mode: use
   `exe_dir.join("data/tempsnapshot")` as the snapshot directory (auto-creating
   `data/` on first run).
3. Otherwise (normal installed mode, e.g. installed to `Program Files`), keep
   the current behavior: `local_appdata_path.join("tempsnapshot")`.
4. If portable mode is selected but `exe_dir` turns out not to be writable
   (permission error on creating `data/`), fall back to the AppData path and
   surface a non-fatal warning to the frontend rather than failing startup.

This is additive — `snapshot_dir_path()` (`database.rs:21`) is the single choke
point every command already goes through, so this only changes one function's
resolution logic, not every call site.

For the *build* itself: Tauri doesn't have a first-class "portable exe" bundle
target, so "no install" in practice means shipping the raw
`target/release/delta.exe` (Windows) / binary (Linux) plus whatever it needs
next to it, rather than the NSIS/MSI/AppImage installers `"targets": "all"`
currently produces (`tauri.conf.json:26`). Recommend adding a `portable` bundle
profile/target (or a packaging script that zips the raw binary + a `data/`
folder) alongside the existing installers, rather than replacing them — most
users still want a normal install.

### B. Path-relative, portable node identity

Change what gets hashed for `id`, without changing the hash function itself:

- Keep `hash_path_id()` as-is, but call it with a path **relative to the
  scanned root**, not the absolute path. E.g. for root `C:\Users\Alice\Projects`
  and file `C:\Users\Alice\Projects\src\main.rs`, hash `"src/main.rs"` (with
  separators normalized to `/` regardless of OS), not the absolute path.
- The root (`Dir` with no parent) always hashes the empty/root string, so its
  ID is stable and equal to any other root regardless of where it's mounted.
- Normalize separators before hashing so a snapshot taken on Windows
  (`src\main.rs`) and one taken on Linux (`src/main.rs`) for the same relative
  tree produce the same ID — this also sets up cross-platform comparison later
  if that's ever wanted.

This is the core fix for your reported bug: identity becomes "same relative
path under the scanned root," which survives a username change, a drive-letter
change, or even the whole tree being moved to a different parent directory.

**Compatibility note:** this changes the ID scheme, so old snapshot `.db`
files won't line up with newly-computed IDs. Bump a schema/version marker (see
C) so old snapshots are recognized as legacy and only used for what they
already support (live-vs-snapshot diff on the *same* machine/path layout),
rather than silently producing wrong diffs against the new ID scheme.

### C. Self-contained snapshot files

Add a `meta` table (single row) to every snapshot DB, written once when the
snapshot is created in `write_current_tree` (`database.rs:162`):

```sql
CREATE TABLE meta (
    schema_version INTEGER NOT NULL,
    root_label TEXT NOT NULL,      -- e.g. "C:" or a user-supplied note
    id_scheme INTEGER NOT NULL,    -- 1 = absolute-path hash (legacy), 2 = relative-path hash
    created_at TEXT NOT NULL
);
```

And add the missing `name` column to the `snapshot` table so a tree can be
reconstructed without a live scan:

```sql
ALTER TABLE snapshot ADD COLUMN name TEXT NOT NULL DEFAULT '';
```

(Storage cost is small relative to the win — names are short strings and this
table is already one row per file/folder.)

With both of these in place, add:

```rust
pub fn load_tree_from_snapshot(db_path: &Path) -> Result<model::Dir, AppError>
```

which walks the `snapshot` table (ordered by `parent_id`, root first) and
rebuilds a `Dir`/`File` tree keyed by `name`, mirroring the structure
`naive_scan` produces today — same shape, just sourced from SQLite rows
instead of `WalkDir`. Sizes/counts (`sub_folder_count`, `sub_file_count`,
`size`) already round-trip; `created`/`modified` timestamps aren't currently
stored and would read as `UNIX_EPOCH` unless added as extra columns (cheap
follow-up if wanted).

### D. Two-snapshot compare

Once (C) exists, generalize the diff path instead of adding a parallel one:

- Add `Dir::diff_against(&self, other_tree_stats: &HashMap<u64, SnapshotRecord>) -> DirViewChildren`
  by extracting the comparison logic that's already in `get_subdir_and_files`
  (`model.rs:219-351`) — it currently takes a `HashMap<u64, SnapshotRecord>`
  fetched from one DB by parent ID; that part doesn't care whether the
  `HashMap` came from a DB query or from walking an in-memory tree loaded via
  `load_tree_from_snapshot`.
- Add a `snapshot_stats_from_tree(&Dir) -> HashMap<u64, SnapshotRecord>` helper
  that flattens a loaded `Dir` tree the same way `query_children_stats_from_parent_id`
  flattens a DB query, so both call sites can feed `diff_against`.
- New command `compare_two_snapshots(snapshot_a, snapshot_b) -> DirViewChildren`:
  load both via `load_tree_from_snapshot`, then call `tree_a.diff_against(&snapshot_stats_from_tree(&tree_b))`.
  "Live vs. snapshot" (today's only mode) becomes the same function with
  `tree_a` = the live in-memory tree.

This reuses the existing diff/view model (`DirViewChildren`, `DirViewMetaDiff`)
end-to-end, so the frontend needs no new rendering logic — just a new command
to call and a UI affordance to pick two saved snapshots instead of one.

## Rollout / compatibility

1. Ship (C) and (B) together — the `meta.id_scheme` field is what lets the
   backend tell a legacy absolute-path-hash snapshot from a new relative-path
   one, and refuse (or clearly label as unreliable) a live-vs-legacy or
   snapshot-vs-snapshot diff that mixes schemes.
2. Ship (D) after (B)/(C) land, since it depends on `load_tree_from_snapshot`
   existing and IDs being comparable across machines.
3. Ship (A) independently — it's the least risky change (pure path
   resolution) and can land first to start dogfooding portable storage before
   the identity/schema work is done.

## Explicitly out of scope for this design

- Cross-platform (Windows snapshot vs. Linux snapshot) compare — the
  separator-normalization in (B) makes it *possible* later, but file
  metadata/semantics differ enough across platforms that it needs its own
  design pass.
- Encrypting or signing snapshot files for transport — "portable" here means
  "copyable and self-describing," not "safe to share with untrusted parties."
