import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { invoke } from "@tauri-apps/api/core"
import { useEffect, useState } from "react"
import { SnapshotFile } from "./data_table_columns"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "./ui/card"
import { columns } from './data_table_columns'
import { DataTable } from "./data_table"
import { RowSelectionState } from "@tanstack/react-table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog"
import { Trash2 } from "lucide-react"
import { snapshotStore } from "./store"

export function SheetDemo() {

  const snapshotFiles = snapshotStore((state) => state.previousSnapshots)
  const setSnapshotFiles = snapshotStore((state) => state.setPreviousSnapshots)

  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [selectedRowFileName, setSelectedRowFileName] = useState<String>("");

  useEffect(() => {
    const fetchFiles = async () => {
      const temp2: SnapshotFile[] = await invoke('get_local_snapshot_files')
      setSnapshotFiles(temp2)
    }
    fetchFiles();
  }, []); 

  useEffect(() => {
    const selectedIndex = Object.keys(rowSelection)[0];
    if (!selectedIndex) {
      setSelectedRowFileName("");
      return;
    }
    const file = snapshotFiles[parseInt(selectedIndex)];
    if (file) {
      const pathString = `${file.drive_letter}_${file.date_sort_key}_${file.size}`;
      setSelectedRowFileName(pathString);
    }
  }, [rowSelection, snapshotFiles]);

  const handle_file_delete = async () => {
    try {
      await invoke('delete_snapshot_file', { selectedRowFileName })

      // refresh state
      try {
        const temp: SnapshotFile[] = await invoke('get_local_snapshot_files')
        setSnapshotFiles(temp)
        setRowSelection({})
      } catch {
        console.log("error fetch file disk data") // temp
      }

    } catch {
      console.log("error occured when deleting")
    }
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Settings</Button>
      </SheetTrigger>
      
      <SheetContent className="w-full sm:max-w-xl flex flex-col h-full p-0 gap-0">
        <SheetHeader className="p-6 border-b bg-background z-10">
          <SheetTitle>Settings</SheetTitle>
          <SheetDescription>
            Manage your local snapshots and configuration.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-slate-900/20">
          <div className="space-y-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Data Management
                </h3>
              </div>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Local Snapshots</CardTitle>
                  <CardDescription>
                    Select a snapshot below to remove it from your local storage.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border bg-background">
                    <DataTable 
                      columns={columns} 
                      data={snapshotFiles} 
                      rowSelection={rowSelection} 
                      setRowSelection={setRowSelection} 
                    />
                  </div>
                </CardContent>
                <CardFooter className="p-4 flex justify-end">
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        size="sm"
                        disabled={selectedRowFileName === ""}
                        className="gap-2"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete Selected
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Snapshot?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete the selected snapshot from your disk.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          className="bg-red-600 hover:bg-red-900"
                          onClick={() => handle_file_delete()}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardFooter>
              </Card>
            </div>

          </div>

        </div>

        <SheetFooter className="p-4 border-t bg-background">
          <SheetClose asChild>
            <Button variant="secondary">Close</Button>
          </SheetClose>
        </SheetFooter>

      </SheetContent>
    </Sheet>
  )
}