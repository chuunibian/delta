import { ColumnDef } from "@tanstack/react-table"
import { Checkbox } from "./ui/checkbox"
import { formatBytes, formatDateTime } from "@/lib/utils"
/*
  current only have drive letter and date and also a date numerical item
  > Instance of data -> {"driveLetter": letter, "date": date, "date_key": key}

*/
/*
  tan stack table row selection:

  internally the library manages the row selection state but you are allowed to 
  manage state youself using onRowSelectionChange

  enableRowSelection accepts a boolean
  row.getCanSelect() in col to see if it can be selected
  or use row.getIsSelected() for the checked= html porp for Checkbox

  then fo ronchange call the state change

  for the UI side get the state of the row like get is selected

*/
export type SnapshotFile = {
  drive_letter: string
  date_time: string,
  date_sort_key: number,
  size: number,
}

export const columns: ColumnDef<SnapshotFile>[] = [
  {
    accessorKey: "driveLetter",
    header: "Drive Name",
    cell: ({ row }) => { // Cell is basically how the actual value is rendered 
      return <div className="flex flex-row gap-2">
        <Checkbox checked={row.getIsSelected()} onCheckedChange={(value) => row.toggleSelected(!!value)}></Checkbox>
        <p>{row.original.drive_letter}</p>
      </div>
    }
  },
  {
    accessorKey: "dateKey", // Header is Date but the accessor key is the number date (for sorting)
    header: "Date",
    cell: ({ row }) => {
      return <div>{formatDateTime(row.original.date_time)}</div>
    }
  },
  {
    accessorKey: "size",
    header: "Size",
    cell: ({ row }) => {
      return <div>
        <p>{formatBytes(row.original.size)}</p>
      </div>
    }
  }
]