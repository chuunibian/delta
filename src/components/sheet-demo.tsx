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
import { createSnapshotColumns } from './data_table_columns'
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
import { Trash2, Settings } from "lucide-react"
import { snapshotStore, useErrorStore } from "./store"
import { HistoryToggle } from "./HistoryToggle"
import { Separator } from '@/components/ui/separator'
import { useTranslation } from "react-i18next"
import { supportedLanguages } from "@/i18n/languages"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"


export function SettingsPage() {
  const { t, i18n } = useTranslation()

  const snapshotFiles = snapshotStore((state) => state.previousSnapshots)
  const setSnapshotFiles = snapshotStore((state) => state.setPreviousSnapshots)
  const columns = createSnapshotColumns(t, i18n.resolvedLanguage ?? i18n.language)

  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [selectedRowFileName, setSelectedRowFileName] = useState<String>("");

  // define variables to get gloval error stuff
  const setCurrentBackendError = useErrorStore((state) => state.setCurrentBackendError)

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const temp2: SnapshotFile[] = await invoke('get_local_snapshot_files')
        setSnapshotFiles(temp2)
      } catch (err) {
        setCurrentBackendError(err) // should be a BackendError Type
        console.log("error fetch file disk data") // temp
      }

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

      // refresh list
      const temp: SnapshotFile[] = await invoke('get_local_snapshot_files')
      setSnapshotFiles(temp)
      setRowSelection({})
    } catch (err) {
      setCurrentBackendError(err)
    }
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="h-7 w-7">
          <Settings></Settings>
        </Button>
      </SheetTrigger>

      <SheetContent className="w-full sm:max-w-xl flex flex-col h-full p-0 gap-0">
        <SheetHeader className="p-6 border-b bg-background z-10">
          <SheetTitle>{t("settings.title")}</SheetTitle>
          <SheetDescription>
            {t("settings.description")}
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-slate-900/20 
          [&::-webkit-scrollbar]:w-2
          [&::-webkit-scrollbar]:h-2
          [&::-webkit-scrollbar-track]:bg-transparent
          [&::-webkit-scrollbar-thumb]:bg-gray-300
          [&::-webkit-scrollbar-thumb]:rounded-full
          dark:[&::-webkit-scrollbar-thumb]:bg-neutral-500
          hover:[&::-webkit-scrollbar-thumb]:bg-gray-400
          dark:hover:[&::-webkit-scrollbar-thumb]:bg-neutral-400">
          <div className="space-y-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  {t("settings.dataManagement")}
                </h3>
              </div>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{t("snapshot.title")}</CardTitle>
                  <CardDescription>
                    {t("snapshot.description")}
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
                        {t("snapshot.deleteSelected")}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t("snapshot.deleteTitle")}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t("snapshot.deleteDescription")}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-red-600 hover:bg-red-900"
                          onClick={() => handle_file_delete()}
                        >
                          {t("common.delete")}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardFooter>
              </Card>

              <Separator></Separator>

              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  {t("settings.configurations")}
                </h3>
              </div>

              <div className="flex flex-row items-center justify-between rounded-lg border bg-card p-4 shadow-sm">
                <div className="space-y-1">
                  <Label className="text-base font-medium">
                    {t("settings.language")}
                  </Label>
                  <p className="text-[0.8rem] text-muted-foreground">
                    {t("settings.languageDescription")}
                  </p>
                </div>
                <Select
                  value={i18n.resolvedLanguage ?? i18n.language}
                  onValueChange={(language) => i18n.changeLanguage(language)}
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {supportedLanguages.map((language) => (
                        <SelectItem key={language.code} value={language.code}>
                          {language.nativeLabel}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <HistoryToggle></HistoryToggle>

            </div>
          </div>
        </div>

        <SheetFooter className="p-4 border-t bg-background">
          <SheetClose asChild>
            <Button variant="secondary">{t("common.close")}</Button>
          </SheetClose>
        </SheetFooter>

      </SheetContent>
    </Sheet>
  )
}
