// import React from 'react'

// const data_table_columns = () => {
//   return (
//     <div>data_table_columns</div>
//   )
// }

// export default data_table_columns

"use client"
 
import { ColumnDef } from "@tanstack/react-table"
import { Checkbox } from "./ui/checkbox"

 
// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
// export type Payment = {
//   id: string
//   amount: number
//   status: "pending" | "processing" | "success" | "failed"
//   email: string
// }


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
    header: "Drive Letter",
    cell: ({row}) => { // Cell is basically how the actual value is rendered 
      return <div className="flex flex-row gap-2">
        <Checkbox checked={row.getIsSelected()} onCheckedChange={(value) => row.toggleSelected(!!value)}></Checkbox>
        <p>{row.original.drive_letter}</p>
        </div> 
    }
  },
  {
    accessorKey: "dateKey", // Header is Date but the accessor key is the number date (for sorting)
    header: "Date",
    cell: ({row}) => {
      return <div>{row.original.date_time}</div>
    }
  },
  {
    accessorKey: "size",
    header: "Size",
    cell: ({row}) => {
      return <div>
        <p>{row.original.size}</p>
      </div>
    }
  }
]