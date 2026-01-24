import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { 
  Folder, // Changed to Folder for this example
  File,
  TrendingUp, 
  HardDrive, 
  Clock, 
  MapPin,
  TrendingDown,
  FolderTree
} from "lucide-react";
import { userStore } from "./store";
import { filesize } from "filesize";

export default function Overview() {
  const file = {
    name: "target",
    extension: "dir",
    path: "/Users/dev/projects/disk-analyzer/src-tauri/target",
    size: "8.4 GB",
    modified: "Just now",
    // Snapshot Logic Mocked:
    hasChanged: true,
    isGrowth: true, // It grew
    diffValue: "1.2 GB",
    prevSize: "7.2 GB"
  };

  const currentNode = userStore((state) => state.currentEntryData)

  const current_size = filesize(Number(currentNode.size), { base: 2, standard: "jedec"}) as string

  const prev_size = currentNode.diff ? (filesize(Number(currentNode.diff.prevsize), { base: 2, standard: "jedec"}) as string) : ("-") 

  let prev_file_count = "-";
  let prev_folder_count = "-";
  
  if (currentNode.directory) { // if directory, also check if node.diff
    prev_file_count = currentNode.diff ? String(currentNode.diff.prevnumfiles) : ("-")
    prev_folder_count = currentNode.diff ? String(currentNode.diff.prevnumsubdir) : ("-")
  }
  
  const curr_file_count = currentNode.numsubfiles ? String(currentNode.numsubfiles) : ("0");
  const curr_folder_count = currentNode.numsubdir ? String(currentNode.numsubdir) : ("0");


  return (
    <div className="w-full h-full flex flex-col p-2 gap-3">
      
      <div className="flex flex-col items-center text-center justify-center p-1">
            <div className="flex flex-row items-center gap-2 text-center">
                <h2 className="font-bold text-base tracking-tight">
                    {currentNode.name}
                </h2>
            </div>
            <div className="flex gap-2 mt-3 items-center">
                {currentNode.directory ? (<Folder className="h-4 w-4 text-muted-foreground"></Folder>) : (<File className="h-4 w-4 text-muted-foreground"></File>)}
                <Badge variant="secondary" className="font-normal text-xs text-muted-foreground">
                    {currentNode.directory ? 'Directory' : 'File'}
                </Badge>
                <Badge variant="outline" className="font-normal text-xs text-muted-foreground font-mono">
                    id: {currentNode.id}
                </Badge>
            </div>
      </div>
      
      {/* Size row */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-3 rounded-lg border bg-card text-card-foreground shadow-sm">
            <span className="text-xs text-muted-foreground flex items-center gap-1.5 uppercase font-bold">
                <HardDrive className="h-3 w-3" /> Size
            </span>
            <p className="text-xs font-bold tracking-tight text-foreground">
                {
                current_size
                }
            </p>
        </div>
        <div className="p-3 rounded-lg bg-muted/40 space-y-1">
            <span className="text-xs text-muted-foreground flex items-center gap-1.5 uppercase font-bold">
                <HardDrive className="h-3 w-3" /> Previous Size
            </span>
            <p className="text-xs font-bold tracking-tight text-foreground">
                {
                prev_size
                }
            </p>
        </div>
        <div className="p-3 rounded-lg bg-muted/40 space-y-1">
            <span className="text-xs text-muted-foreground flex items-center gap-1.5 uppercase font-bold">
                <HardDrive className="h-3 w-3" /> Size Change
            </span>
            <p className="text-xs font-bold tracking-tight text-foreground">
                {
                current_size
                }
            </p>
        </div>

        {/* Subdir row */}
        <div className="p-3 rounded-lg bg-muted/40 space-y-1">
            <span className="text-xs text-muted-foreground flex items-center gap-1.5 uppercase font-bold">
                <FolderTree className="h-3 w-3" /> Subdirs
            </span>
            <p className="text-xs font-medium pt-1">
                {curr_folder_count}
            </p>
        </div>
        <div className="p-3 rounded-lg bg-muted/40 space-y-1">
            <span className="text-xs text-muted-foreground flex items-center gap-1.5 uppercase font-bold">
                <FolderTree className="h-3 w-3" /> Prev Subdirs
            </span>
            <p className="text-xs font-medium pt-1">
                {prev_folder_count}
            </p>
        </div>
        <div className="p-3 rounded-lg bg-muted/40 space-y-1">
            <span className="text-xs text-muted-foreground flex items-center gap-1.5 uppercase font-bold">
                <FolderTree className="h-3 w-3" /> Subdir Change
            </span>
            <p className="text-sm font-medium pt-1">
                {file.modified}
            </p>
        </div>
        
        

        {/* File Row */}
        <div className="p-3 rounded-lg bg-muted/40 space-y-1">
            <span className="text-xs text-muted-foreground flex items-center gap-1.5 uppercase font-bold">
                <Folder className="h-3 w-3" /> Files
            </span>
            <p className="text-xs font-medium pt-1">
                {curr_file_count}
            </p>
        </div>
        <div className="p-3 rounded-lg bg-muted/40 space-y-1">
            <span className="text-xs text-muted-foreground flex items-center gap-1.5 uppercase font-bold">
                <Folder className="h-3 w-3" /> Prev Files
            </span>
            <p className="text-xs font-medium pt-1">
                {prev_file_count}
            </p>
        </div>
        <div className="p-3 rounded-lg bg-muted/40 space-y-1">
            <span className="text-xs text-muted-foreground flex items-center gap-1.5 uppercase font-bold">
                <Folder className="h-3 w-3" /> Files Change
            </span>
            <p className="text-sm font-medium pt-1">
                {file.modified}
            </p>
        </div>
      </div>

      {/* <div className="flex items-center gap-2 w-full">
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border bg-card text-card-foreground shadow-sm text-sm">
        <HardDrive className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="font-medium text-red-600">+1.2GB</span>
        <span className="text-xs text-muted-foreground border-l pl-2 ml-1">Size</span>
      </div>

      <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border bg-card text-card-foreground shadow-sm text-sm">
        <File className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="font-medium text-green-600">+142</span>
        <span className="text-xs text-muted-foreground border-l pl-2 ml-1">Files</span>
      </div>

      <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border bg-card text-card-foreground shadow-sm text-sm">
        <Folder className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="font-medium text-blue-600">+5</span>
        <span className="text-xs text-muted-foreground border-l pl-2 ml-1">Folders</span>
      </div>
     </div> */}

      {/* { currentNode.diff && (
        <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
        <Card className="p-2 bg-red-500/5 shadow-none">
            <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-red-600/80 uppercase">
                    Size Change
                </span>
                <TrendingUp className="h-4 w-4 text-red-600" />
            </div>
            <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-red-600">
                    +{1738}
                </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
                Previous: {prev_size}
            </p>
        </Card>
                <Card className="p-2 bg-green-500/5 shadow-none">
            <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-green-600/80 uppercase">
                    Number File Change
                </span>
                <TrendingDown className="h-4 w-4 text-green-600" />
            </div>
            <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-green-600">
                    +{1738}
                </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
                Previous: {prev_file_count}
            </p>
        </Card>
        </div>
      </div>
      )} */}

        <div className="flex flex-col mt-auto">
        <code className="block text-[10px] text-muted-foreground bg-muted/50 p-1 rounded border break-all font-mono leading-relaxed">
            {currentNode.path}
        </code>
      </div>

    </div>
  );
}