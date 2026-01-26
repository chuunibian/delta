import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import { Folder, FolderOpen, Underline, File, Loader2 } from "lucide-react";
import { DirView, DirViewChildren, TreeDataNode } from "@/types";

// To get the path we could traverse up the tree or we could store it as a field in the interface
// the root is the global state, everything else is helper functions
interface FrontEndFileSystemStore {
    root: TreeDataNode;
    currentPath: string; // used for the temporary onhover path thing
    currentEntryData: TreeDataNode; // used for the side overview
    snapshotFlag: boolean; // a frontend state flag that represents if requests are for snapshot comparing or not true = compare false = don't compare
    prevSnapshotFilePath: string;
    addNewDirView: (currentTreeData: TreeDataNode, pathList: string[]) => void;
    changeCurrentOverviewNode: (currentTreeNode: TreeDataNode) => void;
    changeCurrentPath: (path: string) => void;
    initDirData: (inital: DirView) => void;
    setSnapshotFlag: (flag: boolean) => void;
    setSelectedHistorySnapshotFile: (file: string) => void;
}

// The set and get are for setting the state and getting the state
// note this function will make the backend call
// get a response and then use that response to augment the tree
// so this function also needs to query the hashmap
// go to the augmented tree and add to its children using the backend response
// also should call the above funciton hashNewDirView to input the new things into the hashmap
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

    snapshotFlag: false, // Compare with snapshots? default to do not compare snapshots

    prevSnapshotFilePath: "", // temp name for when there is nothing set and nothing chosen will be empty str

    // Note that this func uses 2 global state when lazy loading
    // The snapshotFlag bool which is to or not to compare with previous snapshot 
    // The current Selected previous snapshot file to comapre to (it is a string) and helps frontend query the previous snapshots
    // ^ Specifically it has the drive letter, date, and size. A func in the abckend will append this to something to query from taht db file
    addNewDirView: async (currentNode, pathList) => {    
    try {

        const { snapshotFlag } = get(); 
        // const state = get(); // ^ expanded of above note get() gets all of the state
        // const snapshot_mode = state.snapshot_mode;
        const { prevSnapshotFilePath } = get();

        const result: DirViewChildren = await invoke<DirViewChildren>(
            'query_new_dir_object',
            { pathList, snapshotFlag, prevSnapshotFilePath }
        );

        userStore.setState((state) => {
            
            const subdirs = result.subdirviews.map((subdir) => ({ // It seems these are the actual nodes that the tree uses for each node!
                id: subdir.id, 
                name: subdir.name,
                size: subdir.meta.size,
                numsubdir: subdir.meta.num_subdir,
                numsubfiles: subdir.meta.num_files,
                // Sql db based stuff, also it seems this is where the info is extracted
                diff: subdir.meta.diff ? {
                  new_flag: subdir.meta.diff.new_dir_flag,
                  prevnumsubdir: subdir.meta.diff.prev_num_subdir,
                  prevnumfiles: subdir.meta.diff.prev_num_files,
                  prevsize: subdir.meta.diff.previous_size,
                } : undefined,

                created: new Date(subdir.meta.created.secs_since_epoch * 1000),

                modified: new Date(subdir.meta.modified.secs_since_epoch * 1000),

                path: `${currentNode.path}\\${subdir.name}`,
                children: [],
                directory: true,
            }));

            // TODO May need to use directory flag to make coniditonal rendering for the overview!!
            const files = result.files.map((file) => ({
                id: file.id, 
                name: file.name,
                size: file.meta.size,
                path: `${currentNode.path}\\${file.name}`,
                // sql db stuff
                diff: file.meta.diff ? {
                  new_flag: file.meta.diff.new_file_flag,
                  prevsize: file.meta.diff.previous_size,
                  // I think since this is file it needs to have uninited diff fields to something that is deafult
                  // OR leave it out and just use teh directory flag to conditional it
                } : undefined,
                directory: false,

                created: new Date(file.meta.created.secs_since_epoch * 1000),

                modified: new Date(file.meta.modified.secs_since_epoch * 1000),
            }));

            const newChildren = [...subdirs, ...files];

            // Mutate the node reference directly
            currentNode.children = newChildren;

            // FORCE RE-RENDER:
            return {
                root: { ...state.root }, 
            };
        });

      } catch (error) {
          console.error(error);
          userStore.setState((state) => {
              currentNode.children = []; 
              return { 
                  root: { ...state.root } 
              };
          });
      }
    },

    changeCurrentPath: (path) => {
      userStore.setState({currentPath: path})
    },

    changeCurrentOverviewNode: (currentTreeNode) => { // Note this creates copies I think I dont know if this will ever be a perfoamcen factor or bad desing that needs a diff approach
      userStore.setState({currentEntryData: currentTreeNode})
    },

    initDirData: (initial) => {
        // takes in initial dir view which is unexpanded X:\        
        // change the root based on the passed in stuff
        userStore.setState((state) => {

            const initRoot = {
              id: initial.id,
              name: initial.name,
              size: initial.meta.size,
              path: initial.name,
              numsubdir: initial.meta.num_subdir,
              numsubfiles: initial.meta.num_files,
              children: [],
              // sql stuff
              diff: initial.meta.diff ? {
                new_flag: initial.meta.diff.new_dir_flag,
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
            };
        }
      )
    },

    setSelectedHistorySnapshotFile: (fileName) => {
      set({prevSnapshotFilePath: fileName})
    },

    setSnapshotFlag: (flag) => {
      set({snapshotFlag: flag})
    }

}));
