import { ColumnDef } from "@tanstack/react-table"
import { Checkbox } from "./ui/checkbox"
import { formatBytes, formatDateTime } from "@/lib/utils"

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