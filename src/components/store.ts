import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import { BackendError, CurrentEntryDetails, DirView, DirViewChildren, TreeDataNode } from "@/types";
import { appendPaths } from "@/lib/utils";
import { SnapshotFile } from "./data_table_columns";

export type SortColumn = "name" | "size" | "change";
export type SortDirection = "asc" | "desc";

interface SortStore {
  sortColumn: SortColumn;
  sortDirection: SortDirection;
  toggleSort: (column: SortColumn) => void;
}

export const useSortStore = create<SortStore>((set, get) => ({
  sortColumn: "size",
  sortDirection: "desc",
  // helper emt
  toggleSort: (column) => {
    const { sortColumn, sortDirection } = get();
    if (sortColumn === column) {
      set({ sortDirection: sortDirection === "asc" ? "desc" : "asc" });
    } else {
      set({ sortColumn: column, sortDirection: "desc" });
    }
    // re-sort the frontend fs tree representation in place and force re-render
    const root = userStore.getState().root;
    const { sortColumn: col, sortDirection: dir } = useSortStore.getState();
    sortTreeInPlace(root, col, dir);
    userStore.setState({ root: { ...root } });
  },
}));

// compute size change helper
function getChangeValue(node: TreeDataNode): number {
  if (!node.diff) return 0;
  if (node.diff.deleted_flag) return (node.diff.prevsize ?? 0) - (node.size ?? 0);
  return (node.size ?? 0) - (node.diff.prevsize ?? 0);
}

// Recursively sort every children array in the tree in-place
export function sortTreeInPlace(
  node: TreeDataNode,
  column: SortColumn,
  direction: SortDirection
): void {
  if (!node.children || node.children.length === 0) return;

  const dir = direction === "asc" ? 1 : -1;

  node.children.sort((a, b) => {
    if (a.directory !== b.directory) return a.directory ? -1 : 1;

    switch (column) {
      case "name":
        return dir * a.name.localeCompare(b.name);
      case "size":
        return dir * ((a.size ?? 0) - (b.size ?? 0));
      case "change":
        return dir * (Math.abs(getChangeValue(a)) - Math.abs(getChangeValue(b)));
      default:
        return 0;
    }
  });

  // recurse search for each child
  for (const child of node.children) {
    sortTreeInPlace(child, column, direction);
  }
}

// Shared by addNewDirView (live-vs-snapshot) and startSnapshotCompare
// (snapshot-vs-snapshot) since both consume the same DirViewChildren shape.
function mapDirViewChildrenToTreeNodes(result: DirViewChildren, parentPath: string): TreeDataNode[] {
  const subdirs: TreeDataNode[] = result.subdirviews.map((subdir) => ({
    id: subdir.id,
    name: subdir.name,
    size: subdir.meta.size,
    numsubdir: subdir.meta.num_subdir,
    numsubfiles: subdir.meta.num_files,

    diff: subdir.meta.diff ? {
      new_flag: subdir.meta.diff.new_dir_flag,
      deleted_flag: subdir.meta.diff.deleted_dir_flag,
      prevnumsubdir: subdir.meta.diff.prev_num_subdir,
      prevnumfiles: subdir.meta.diff.prev_num_files,
      prevsize: subdir.meta.diff.previous_size,
    } : undefined,

    created: new Date(subdir.meta.created.secs_since_epoch * 1000),
    modified: new Date(subdir.meta.modified.secs_since_epoch * 1000),

    path: appendPaths(parentPath, subdir.name),
    children: [],
    directory: true,
  }));

  const files: TreeDataNode[] = result.files.map((file) => ({
    id: file.id,
    name: file.name,
    size: file.meta.size,
    path: appendPaths(parentPath, file.name),

    diff: file.meta.diff ? {
      new_flag: file.meta.diff.new_file_flag,
      prevsize: file.meta.diff.previous_size,
      deleted_flag: file.meta.diff.deleted_file_flag,
    } : undefined,
    directory: false,

    created: new Date(file.meta.created.secs_since_epoch * 1000),
    modified: new Date(file.meta.modified.secs_since_epoch * 1000),
  }));

  return [...subdirs, ...files];
}

// caching ht for history graph making it a singleton for now
let historyCache: Record<string, { timestamp: number; sizeBytes: number }[]> = {}
// TODO cache clear helper
export const clearHistoryCache = () => {
  historyCache = {};
};

// To get the path we could traverse up the tree or we could store it as a field in the interface
// the root is the global state, everything else is helper functions
interface FrontEndFileSystemStore {
  root: TreeDataNode;
  currentPath: string; // used for the temporary onhover path thing
  currentEntryDetail: CurrentEntryDetails; // used for the quick detail at top bar
  currentEntryData: TreeDataNode; // used for the side overview
  snapshotFlag: boolean; // a frontend state flag that represents if requests are for snapshot comparing or not true = compare false = don't compare
  prevSnapshotFilePath: string;
  // Snapshot-vs-snapshot compare mode (as opposed to live-scan-vs-snapshot).
  // See docs/designDeltaPortableApp.md (part D).
  compareMode: boolean;
  currentSnapshotFile: string;
  comparisonSnapshotFile: string;
  addNewDirView: (currentTreeData: TreeDataNode, pathList: string[]) => void;
  changeCurrentOverviewNode: (currentTreeNode: TreeDataNode) => void;
  changeCurrentPath: (path: string) => void;
  changeCurrentEntryDetails: (numsubdir: number, numsubfile: number) => void;
  initDirData: (inital: DirView, rootPath: string) => void;
  startSnapshotCompare: (currentSnapshotFile: string, comparisonSnapshotFile: string, rootLabel: string) => Promise<void>;
  setSnapshotFlag: (flag: boolean) => void;
  setSelectedHistorySnapshotFile: (file: string) => void;
}

interface FrontEndSnapshotStore {
  previousSnapshots: SnapshotFile[];
  setPreviousSnapshots: (snapshotFileList: SnapshotFile[]) => void; // need spread to force rerender
}

interface ErrorStore {
  currentBackendErrors: BackendError[];
  setCurrentBackendError: (newError: BackendError) => void; // send current backend error based on a new 
}

interface DirEntryHistoryStore {
  currentDirEntryHistory: { timestamp: number; sizeBytes: number }[];
  activeHistoryPath: string | null; // rc condition helper
  queryDirEntryHistory: (rootPath: string, absolutePath: string) => void;
  setCurrentDirEntryHistory: (newHistory: { timestamp: number; sizeBytes: number }[]) => void;
}

interface FrontEndConfigurationStore {
  ShowHistory: boolean;
  setShowHistory: (flag: boolean) => void;
  // If ever need more configs add here
  // saving configs to persistent config file in future also 
}

export const useConfigurationStore = create<FrontEndConfigurationStore>((set) => ({
  ShowHistory: false,
  setShowHistory: (flag) => {
    set({ ShowHistory: flag })
  }
}))

export const useDirEntryHistoryStore = create<DirEntryHistoryStore>((set, get) => ({
  currentDirEntryHistory: [],
  activeHistoryPath: null,

  queryDirEntryHistory: async (rootPath, absolutePath) => {

    // mark curr as the current active, this line is sync with onClick call so order is ensured
    set({ activeHistoryPath: absolutePath });

    // Check if history flag disabled
    const showHistoryFlag = useConfigurationStore.getState().ShowHistory;

    if (!showHistoryFlag) {
      return;
    }

    if (historyCache[absolutePath]) {
      set({ currentDirEntryHistory: historyCache[absolutePath] });
      return;
    }

    try {
      const result: [string, number][] = await invoke(
        'get_path_historical_data',
        { rootPath, absolutePath }
      );

      console.log(result)

      // If many async calls to this func is scheduled in rt then no guarentee of the order
      // so only let the correct name one change state using a fast helper to mark the activeHistoryPath
      if (get().activeHistoryPath !== absolutePath) {
        return;
      }

      const formattedHistory = result.map(([dateStr, sizeBytes]) => ({
        timestamp: new Date(dateStr).getTime(),
        sizeBytes,
      }));

      set({ currentDirEntryHistory: formattedHistory });
      historyCache[absolutePath] = formattedHistory;
    } catch (error) {
      // for error set curr to empty
      useErrorStore.getState().setCurrentBackendError(error as BackendError);
      set({ currentDirEntryHistory: [] });
    }
  },

  setCurrentDirEntryHistory: (newHistory) => set({ currentDirEntryHistory: newHistory }),
}));


export const useErrorStore = create<ErrorStore>((set) => ({
  currentBackendErrors: [],
  setCurrentBackendError: (newError) => set((state) => ({ // append new error to list and forces ref change
    currentBackendErrors: [...state.currentBackendErrors, newError]
  })),
}));


export const snapshotStore = create<FrontEndSnapshotStore>((set, get) => ({
  previousSnapshots: [],
  setPreviousSnapshots: (snapshotFileList) => {
    set({ previousSnapshots: snapshotFileList })
  },
}))

export const userStore = create<FrontEndFileSystemStore>((set, get) => ({
  root:
  {
    id: "root",
    name: "Root",
    path: "/",
    children: [],
    size: 0,
    directory: true,
  },

  currentEntryData:
  {
    id: "root",
    name: "Root",
    path: "/",
    children: [],
    size: 0,
    directory: true,
  },

  currentPath: "N/A",

  snapshotFlag: false, // default to do not compare snapshots

  prevSnapshotFilePath: "", // temp name for when there is nothing set and nothing chosen will be empty str

  compareMode: false,
  currentSnapshotFile: "",
  comparisonSnapshotFile: "",

  currentEntryDetail: {
    numsubdir: 0,
    numsubfile: 0,
  },

  addNewDirView: async (currentNode, pathList) => {
    try {

      const { snapshotFlag, prevSnapshotFilePath, compareMode, currentSnapshotFile, comparisonSnapshotFile } = get();

      const result: DirViewChildren = compareMode
        ? await invoke<DirViewChildren>(
          'compare_two_snapshots',
          { currentSnapshotFile, comparisonSnapshotFile, pathList }
        )
        : await invoke<DirViewChildren>(
          'query_new_dir_object',
          { pathList, snapshotFlag, prevSnapshotFilePath }
        );

      userStore.setState((state) => {

        const newChildren = mapDirViewChildrenToTreeNodes(result, currentNode.path);

        // Mutate the node reference directly
        currentNode.children = newChildren;

        // Sort newly loaded children to respect current sort order
        // backend already sends size desc so skip in that case
        const { sortColumn, sortDirection } = useSortStore.getState();
        if (sortColumn !== "size" || sortDirection !== "desc") {
          sortTreeInPlace(currentNode, sortColumn, sortDirection);
        }

        // FORCE RE-RENDER:
        return {
          root: { ...state.root },
        };
      });

    } catch (error) {
      useErrorStore.getState().setCurrentBackendError(error); // getState for non react lifecycle bound
      console.error(error);
      userStore.setState((state) => {
        currentNode.children = [];
        return {
          root: { ...state.root }
        };
      });
    }
  },

  changeCurrentPath: (path) =>
    set({ currentPath: path }),

  changeCurrentEntryDetails: (numsubdir, numsubfile) =>
    set({
      currentEntryDetail: { numsubdir, numsubfile },
    }),

  changeCurrentOverviewNode: (currentTreeNode) =>
    set({ currentEntryData: currentTreeNode }),

  initDirData: (initial, rootPath) => {
    // takes in initial dir view which is unexpanded X:\
    // change the root based on the passed in stuff

    userStore.setState((state) => {

      const initRoot = {
        id: initial.id,
        name: initial.name,
        size: initial.meta.size,
        // path: initial.name,
        path: rootPath,
        numsubdir: initial.meta.num_subdir,
        numsubfiles: initial.meta.num_files,
        children: [],
        // sql stuff
        diff: initial.meta.diff ? {
          new_flag: initial.meta.diff.new_dir_flag,
          deleted_flag: initial.meta.diff.deleted_dir_flag,
          prevnumsubdir: initial.meta.diff.prev_num_subdir,
          prevnumfiles: initial.meta.diff.prev_num_files,
          prevsize: initial.meta.diff.previous_size,
        } : undefined,
        directory: true, // root shoudl always be a folder
      };

      return { // init current states
        root: initRoot,
        currentEntryData: initRoot,
        currentPath: initial.name,
        compareMode: false, // a live scan always supersedes any prior snapshot-vs-snapshot session
      };
    }
    )
  },

  // Design fix (part D): load the root level of a snapshot-vs-snapshot diff.
  // Unlike disk_scan, compare_two_snapshots has no live root DirView to seed
  // from (both sides are saved snapshots), so the root node is synthesized
  // here and its children come back the same way any other directory's do.
  startSnapshotCompare: async (currentSnapshotFile, comparisonSnapshotFile, rootLabel) => {
    const result: DirViewChildren = await invoke<DirViewChildren>(
      'compare_two_snapshots',
      { currentSnapshotFile, comparisonSnapshotFile, pathList: [] }
    );

    const initRoot: TreeDataNode = {
      id: "root",
      name: rootLabel,
      path: rootLabel,
      children: [],
      size: 0,
      directory: true,
    };

    initRoot.children = mapDirViewChildrenToTreeNodes(result, rootLabel);
    initRoot.size = initRoot.children.reduce((sum, child) => sum + (child.size ?? 0), 0);

    userStore.setState({
      root: initRoot,
      currentEntryData: initRoot,
      currentPath: rootLabel,
      compareMode: true,
      currentSnapshotFile,
      comparisonSnapshotFile,
    });
  },

  setSelectedHistorySnapshotFile: (fileName) => {
    set({ prevSnapshotFilePath: fileName })
  },

  setSnapshotFlag: (flag) => {
    set({ snapshotFlag: flag })
  }

}));
