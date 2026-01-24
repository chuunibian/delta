import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { Table } from "lucide-react"
import { useEffect, useState } from "react"
import { SnapshotFile } from "./data_table_columns"
import { Card } from "./ui/card"
import { columns } from './data_table_columns'
import { DataTable } from "./data_table"
import { RowSelectionState } from "@tanstack/react-table"

export function SheetDemo() {

  const [snapshotFiles, setSnapshotFiles] = useState<SnapshotFile[]>([]); // state for list of prev db files from backend

  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  
  useEffect(() => {
    const testTable = async () => {
      const temp2: SnapshotFile[] = await invoke('get_local_snapshot_files')
      setSnapshotFiles(temp2)
    }

    testTable();
  });

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Settings</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Settings</SheetTitle>
        </SheetHeader>
          <DataTable columns={columns} data={snapshotFiles} rowSelection={rowSelection} setRowSelection={setRowSelection} ></DataTable>

        <SheetFooter>
          <Button type="submit">Save changes</Button>
          <SheetClose asChild>
            <Button variant="outline">Close</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
