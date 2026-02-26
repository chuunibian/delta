import { Badge } from "@/components/ui/badge";
import {
    Folder,
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
import { Button } from "./ui/button";

import { openPath, openUrl, revealItemInDir } from '@tauri-apps/plugin-opener';
import { formatBytes } from "@/lib/utils";

export default function Overview() {


    const currentNode = userStore((state) => state.currentEntryData)

    const current_size = currentNode.size
    const current_size_str = filesize(Number(current_size), { base: 2, standard: "jedec" }) as string

    const prev_size = currentNode.diff ? (currentNode.diff.prevsize) : (0);
    const prev_size_str = currentNode.diff ? (filesize(Number(currentNode.diff.prevsize), { base: 2, standard: "jedec" }) as string) : ("-")

    let prev_file_count_str = "-";
    let prev_folder_count_str = "-";
    let prev_file_count = 0;
    let prev_folder_count = 0;

    if (currentNode.directory) { // if directory, also check if node.diff
        prev_file_count = currentNode.diff ? (currentNode.diff.prevnumfiles) : (0);
        prev_folder_count = currentNode.diff ? (currentNode.diff.prevnumsubdir) : (0);
        prev_file_count_str = currentNode.diff ? String(currentNode.diff.prevnumfiles) : ("-")
        prev_folder_count_str = currentNode.diff ? String(currentNode.diff.prevnumsubdir) : ("-")
    }

    const curr_folder_count = currentNode.numsubdir ? (currentNode.numsubdir) : (0);
    const curr_file_count = currentNode.numsubfiles ? (currentNode.numsubfiles) : (0);
    const curr_file_count_str = currentNode.numsubfiles ? String(currentNode.numsubfiles) : ("0");
    const curr_folder_count_str = currentNode.numsubdir ? String(currentNode.numsubdir) : ("0");

    const test_reveal_opener = async (path) => {
        await revealItemInDir(path);
    }

    return (
        <div className="w-full h-full flex flex-col p-2 gap-3 overflow-y-auto">

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
                </div>
            </div>

            {/* Size row */}
            <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))' }}>
                <div className="p-3 rounded-lg border bg-card text-card-foreground shadow-sm">
                    <span className="text-xs text-muted-foreground flex items-center gap-1.5 uppercase font-bold">
                        <HardDrive className="h-3 w-3" /> Size
                    </span>
                    <p className="text-xs font-bold tracking-tight text-foreground">
                        {
                            current_size_str
                        }
                    </p>
                </div>
                <div className="p-3 rounded-lg bg-muted/40 space-y-1">
                    <span className="text-xs text-muted-foreground flex items-center gap-1.5 uppercase font-bold">
                        <HardDrive className="h-3 w-3" /> Previous Size
                    </span>
                    <p className="text-xs font-bold tracking-tight text-foreground">
                        {
                            prev_size_str
                        }
                    </p>
                </div>
                <div className="p-3 rounded-lg bg-muted/40 space-y-1">
                    <span className="text-xs text-muted-foreground flex items-center gap-1.5 uppercase font-bold">
                        <HardDrive className="h-3 w-3" /> Size Change
                    </span>
                    <p className="text-xs font-bold tracking-tight text-foreground">
                        {
                            currentNode.diff ? (formatBytes(current_size - prev_size)) : ("-")
                        }
                    </p>
                </div>

                {/* Subdir row */}
                <div className="p-3 rounded-lg border bg-card text-card-foreground shadow-sm">
                    <span className="text-xs text-muted-foreground flex items-center gap-1.5 uppercase font-bold">
                        <FolderTree className="h-3 w-3" /> Subdirs
                    </span>
                    <p className="text-xs font-medium pt-1">
                        {curr_folder_count_str}
                    </p>
                </div>
                <div className="p-3 rounded-lg bg-muted/40 space-y-1">
                    <span className="text-xs text-muted-foreground flex items-center gap-1.5 uppercase font-bold">
                        <FolderTree className="h-3 w-3" /> Prev Subdirs
                    </span>
                    <p className="text-xs font-medium pt-1">
                        {prev_folder_count_str}
                    </p>
                </div>
                <div className="p-3 rounded-lg bg-muted/40 space-y-1">
                    <span className="text-xs text-muted-foreground flex items-center gap-1.5 uppercase font-bold">
                        <FolderTree className="h-3 w-3" /> Subdir Change
                    </span>
                    <p className="text-sm font-medium pt-1">
                        {(currentNode.diff && currentNode.directory) ? (curr_folder_count - prev_folder_count) : ("-")}
                    </p>
                </div>



                {/* File Row */}
                <div className="p-3 rounded-lg border bg-card text-card-foreground shadow-sm">
                    <span className="text-xs text-muted-foreground flex items-center gap-1.5 uppercase font-bold">
                        <Folder className="h-3 w-3" /> Files
                    </span>
                    <p className="text-xs font-medium pt-1">
                        {curr_file_count_str}
                    </p>
                </div>
                <div className="p-3 rounded-lg bg-muted/40 space-y-1">
                    <span className="text-xs text-muted-foreground flex items-center gap-1.5 uppercase font-bold">
                        <Folder className="h-3 w-3" /> Prev Files
                    </span>
                    <p className="text-xs font-medium pt-1">
                        {prev_file_count_str}
                    </p>
                </div>
                <div className="p-3 rounded-lg bg-muted/40 space-y-1">
                    <span className="text-xs text-muted-foreground flex items-center gap-1.5 uppercase font-bold">
                        <Folder className="h-3 w-3" /> Files Change
                    </span>
                    <p className="text-sm font-medium pt-1">
                        {(currentNode.diff && currentNode.directory) ? (curr_file_count - prev_file_count) : ("-")}
                    </p>
                </div>
            </div>


            <div className="flex flex-wrap items-center gap-2 w-full">
                <div className="flex flex-1 min-w-0 items-center gap-2 px-3 py-1.5 rounded-md border bg-card text-card-foreground shadow-sm text-sm">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-medium text-gray-300">{currentNode.created?.toLocaleDateString() || "N/A"}</span>
                    <span className="text-sm text-muted-foreground border-l pl-2 ml-1">Created</span>
                </div>

                <div className="flex flex-1 min-w-0 items-center gap-2 px-3 py-1.5 rounded-md border bg-card text-card-foreground shadow-sm text-sm">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-medium text-gray-300">{currentNode.modified?.toLocaleDateString() || "N/A"}</span>
                    <span className="text-sm text-muted-foreground border-l pl-2 ml-1">Modified</span>
                </div>
            </div>

            <div className="flex flex-col mt-auto">
                <div className="relative">
                    <code className="block text-[12px] text-muted-foreground bg-muted/50 p-2 pr-10 rounded border break-all font-mono leading-relaxed">
                        {currentNode.path}
                    </code>

                    <Button className="absolute bottom-1 right-1 h-3 px-2 text-[10px] " variant="destructive" onClick={
                        () => { test_reveal_opener(currentNode.path) }
                    }>Reveal</Button>
                    <Button className="absolute bottom-1 right-13 h-3 px-2 text-[10px] " variant="outline" onClick={
                        () => { navigator.clipboard.writeText(currentNode.path) }
                    }>Copy</Button>
                </div>
            </div>
        </div>
    );
}