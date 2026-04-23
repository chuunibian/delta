import React, { useState, useEffect } from 'react'
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card'
import DiskPath from './disk_path'
import { Separator } from '@/components/ui/separator'
import CustomPath from './custom_path'
import { Button } from './ui/button'
import { Checkbox } from './ui/checkbox'
import { Label } from '@/components/ui/label'

import { invoke } from '@tauri-apps/api/core';
import { snapshotStore, useErrorStore, userStore } from './store'
import { DataTable } from './data_table'
import { SnapshotFile } from './data_table_columns'

import { createSnapshotColumns } from './data_table_columns'
import { RowSelectionState } from '@tanstack/react-table'
import Progress from './progress'

import DeltaLogo from '../../src-tauri/icons/64x64.png'
import { DirView, InitDisk } from '@/types'
import TopBar from './top-bar'
import { ScanTabs } from './ScanTabs'
import { useTranslation } from 'react-i18next'

interface SplashPageProps {
  setWhichField: React.Dispatch<React.SetStateAction<boolean>>;
}

const SplashPage: React.FC<SplashPageProps> = ({ setWhichField }) => {
  const { t, i18n } = useTranslation()
  const columns = createSnapshotColumns(t, i18n.resolvedLanguage ?? i18n.language)

  // const [disks, setDisks] = useState<InitDisk[]>([]);

  // const [selectedDisk, setSelectedDisk] = useState<string>(""); // for full disk paths

  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  // const [saveCurrentSnapshotFlag, setSaveCurrentSnapshotFlag] = useState<boolean>(true);

  const snapshotFiles = snapshotStore((state) => state.previousSnapshots)

  const setSnapshotFiles = snapshotStore((state) => state.setPreviousSnapshots)

  // const snapshotFlag = userStore((state) => state.snapshotFlag) // this flag is for if to save snapshot or not 

  const setSnapshotFlag = userStore((state) => state.setSnapshotFlag)

  // const snapshotFile = userStore((state) => state.prevSnapshotFilePath)

  const setSnapshotFile = userStore((state) => state.setSelectedHistorySnapshotFile) // this is for the SELECTED history file string!

  const setCurrentBackendError = useErrorStore((state) => state.setCurrentBackendError)


  useEffect(() => {

    const getSnapshotTable = async () => {
      try {
        const resp: SnapshotFile[] = await invoke('get_local_snapshot_files')
        setSnapshotFiles(resp)
      } catch (err) {
        setCurrentBackendError(err)
      }
    }

    getSnapshotTable()
  }, []);

  // for bridging selected snapshot file and zustand global state for it
  useEffect(() => {
    const selectedIndex = Object.keys(rowSelection)[0] // Get "0"
    const selectedData = snapshotFiles[parseInt(selectedIndex)]

    if (!selectedData) {
      setSnapshotFile("") // reset these on mount
      setSnapshotFlag(false)
      return;
    }

    setSnapshotFile(`${selectedData.drive_letter}_${selectedData.date_sort_key}_${selectedData.size}`) // sync to zustand
  }, [rowSelection, snapshotFiles, setSnapshotFile]);


  return (
    <div className="flex flex-col h-screen bg-stone-800">
      <TopBar></TopBar>

      <div className="flex flex-1 flex-wrap items-center justify-center gap-6 p-6 overflow-auto">

        {/* Temp image */}
        <img src={DeltaLogo} alt={t("app.logoAlt")} className='transition-all duration-500 hover:scale-150 hover:rotate-180 opacity-90 hover:opacity-100 cursor-pointer fixed bottom-9 right-9' />

        {/* Test data table for snapshots, datatable should be generic */}
        <Card className='p-3 min-w-[350px]'>
          <DataTable columns={columns} data={snapshotFiles} rowSelection={rowSelection} setRowSelection={setRowSelection} ></DataTable>
        </Card>

        {/* disk scan tabs */}
        <ScanTabs setWhichField={setWhichField}></ScanTabs>

      </div>
    </div>
  )
}

export default SplashPage
