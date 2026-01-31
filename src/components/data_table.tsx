/*
  datatable notes:

  tanstacktable is headless basically no UI just the brains to make a table

  for the headless table to work you need the:

  data - standard array of objects each inst is a row basically
  columns - map data keys to headers. Headers are the attributes of hte table basically
  ^ columns is pretty powerful you can do much stuff

  hook (useReactTable) - an engine that needs data and columns and this returns an obj table
  that has functions that can render the html

  so the useReactTable gives an object which then you can call 

  getHeaderGroups() for <thead>

  getRowModel() for <tbody>

  getVisibleCells for <td> // acutal row?

  ---------------------------------------------------------------------
  Since shadecn is used basically shadecn provides the ui so use those components

  ---------------------------------------------------------------------

  current only have drive letter and date and also a date numerical item
  > Instance of data -> {"driveLetter": letter, "date": date, "date_key": key}

*/

import { ScrollArea } from "./ui/scroll-area"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import { ColumnDef, flexRender, getCoreRowModel, OnChangeFn, RowSelectionState, useReactTable } from "@tanstack/react-table"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  rowSelection: RowSelectionState
  setRowSelection: OnChangeFn<RowSelectionState>
}

// making the datatable generic with the input types
export function DataTable<TData, TValue>({columns, data, rowSelection, setRowSelection}: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    enableRowSelection: true,
    enableMultiRowSelection: false,
    onRowSelectionChange: setRowSelection,
    state: {
      rowSelection,
    }
  
  })

  return (
    <div className="rounded-md border overflow-hidden">
      <ScrollArea className="h-[450px] w-full rounded-md border">
        <Table>
          <TableHeader className="bg-stone-950">
            {
              table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {
                    headerGroup.headers.map((header) => {
                      return (
                        <TableHead key={header.id}>
                          {
                            header.isPlaceholder ?
                              null : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )
                          }
                        </TableHead>
                      )
                    })
                  }

                </TableRow>
              ))
            }
          </TableHeader>
          <TableBody className="bg-stone-950">
            {
              table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="data-[state=selected]:bg-green-950"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) :
              (
                <TableRow>
                  <TableCell colSpan={columns.length} className="text-center">
                    No snapshot files.
                  </TableCell>
                </TableRow>
              )
            }
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  )

}
