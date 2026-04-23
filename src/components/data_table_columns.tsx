import { ColumnDef } from "@tanstack/react-table"
import { Checkbox } from "./ui/checkbox"
import { formatBytes, formatDateTime } from "@/lib/utils"
import { TFunction } from "i18next"

export type SnapshotFile = {
  drive_letter: string
  date_time: string,
  date_sort_key: number,
  size: number,
}

export const createSnapshotColumns = (
  t: TFunction,
  locale: string
): ColumnDef<SnapshotFile>[] => [
  {
    accessorKey: "driveLetter",
    header: t("snapshot.columns.driveName"),
    cell: ({ row }) => { // Cell is basically how the actual value is rendered 
      return <div className="flex flex-row gap-2">
        <Checkbox checked={row.getIsSelected()} onCheckedChange={(value) => row.toggleSelected(!!value)}></Checkbox>
        <p>{row.original.drive_letter}</p>
      </div>
    }
  },
  {
    accessorKey: "dateKey", // Header is Date but the accessor key is the number date (for sorting)
    header: t("snapshot.columns.date"),
    cell: ({ row }) => {
      return <div>{formatDateTime(row.original.date_time, locale)}</div>
    }
  },
  {
    accessorKey: "size",
    header: t("snapshot.columns.size"),
    cell: ({ row }) => {
      return <div>
        <p>{formatBytes(row.original.size)}</p>
      </div>
    }
  }
]
