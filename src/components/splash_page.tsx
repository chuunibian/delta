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

import { columns } from './data_table_columns'
import { RowSelectionState } from '@tanstack/react-table'
import Progress from './progress'

import DeltaLogo from '../../src-tauri/icons/64x64.png'
import { DirView, InitDisk } from '@/types'
import TopBar from './top-bar'

interface SplashPageProps {
  setWhichField: React.Dispatch<React.SetStateAction<boolean>>;
}

const SplashPage: React.FC<SplashPageProps> = ({ setWhichField }) => {

  const [disks, setDisks] = useState<InitDisk[]>([]);

  const [selectedDisk, setSelectedDisk] = useState<string>("");

  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const [saveCurrentSnapshotFlag, setSaveCurrentSnapshotFlag] = useState<boolean>(true);

  const snapshotFiles = snapshotStore((state) => state.previousSnapshots)

  const setSnapshotFiles = snapshotStore((state) => state.setPreviousSnapshots)

  const snapshotFlag = userStore((state) => state.snapshotFlag) // this flag is for if to save snapshot or not 

  const setSnapshotFlag = userStore((state) => state.setSnapshotFlag)

  const snapshotFile = userStore((state) => state.prevSnapshotFilePath)

  const setSnapshotFile = userStore((state) => state.setSelectedHistorySnapshotFile) // this is for the SELECTED history file string!

  const setCurrentBackendError = useErrorStore((state) => state.setCurrentBackendError)


  useEffect(() => {
    const getDisks = async () => {
      try {
        const result = await invoke<InitDisk[]>('retreive_disks', {});

        setDisks(result)

      } catch (err) {
        setCurrentBackendError(err)
        setDisks([{ name: "Unknown", desc: "No Disks Found" }])
      }
    }

    const testTable = async () => {
      try {
        const temp2: SnapshotFile[] = await invoke('get_local_snapshot_files')
        setSnapshotFiles(temp2)
      } catch (err) {
        setCurrentBackendError(err)
      }
    }

    getDisks();
    testTable()
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

  const runScan = async (target: string) => {
    try {

      console.time("invoke");
      const result = await invoke<DirView>('disk_scan', { target, snapshotFile, snapshotFlag });
      console.timeEnd("invoke");

      const zustandInitFunc = userStore.getState().initDirData;

      if (saveCurrentSnapshotFlag) {
        const selectedDisk = target
        const temp = await invoke('write_current_tree', { selectedDisk });
      }

      zustandInitFunc(result);

      setWhichField(false); // state switch to anallytics screen

    } catch (e) {
      setCurrentBackendError(e)
      console.log(e)
    }
  }


  return (
    <div className="flex flex-col h-screen bg-stone-800">
      <TopBar></TopBar>

      <div className="flex flex-1 flex-wrap items-center justify-center gap-6 p-6 overflow-auto">

        {/* Temp image */}
        <img src={DeltaLogo} alt="This the App Logo" className='transition-all duration-500 hover:scale-150 hover:rotate-180 opacity-90 hover:opacity-100 cursor-pointer fixed bottom-9 right-9' />

        {/* Test data table for snapshots, datatable should be generic */}
        <Card className='p-3 min-w-[350px]'>
          <DataTable columns={columns} data={snapshotFiles} rowSelection={rowSelection} setRowSelection={setRowSelection} ></DataTable>
        </Card>



        {/* disk scan card */}
        <Card className='w-[28rem] p-7'>
          <CardHeader>
            <CardTitle>Start Snapshot</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-5">
              <p className="text-sm leading-none font-medium">"Disk"</p>
              <DiskPath disks={disks} onValueChange={setSelectedDisk}></DiskPath>
              <Separator></Separator>
              <p className="text-sm leading-none font-medium">"Custom Path"</p>
              <CustomPath></CustomPath>
              <Separator></Separator>
              {/* Dry run checkbox */}
              <div className="flex items-start gap-3">
                <Checkbox id="terms-2" disabled={snapshotFile === ""} checked={snapshotFlag} onCheckedChange={setSnapshotFlag} />
                <div className="grid gap-2">
                  <Label htmlFor="terms-2">Compare Snapshots</Label>
                  <p className="text-muted-foreground text-sm">
                    Compare current scan with previous scanned snapshot
                  </p>
                </div>
              </div>

              <Separator></Separator>

              <div className="flex items-start gap-3">
                <Checkbox id="terms-2" checked={saveCurrentSnapshotFlag} onCheckedChange={(checked) => setSaveCurrentSnapshotFlag(checked === true)} /*<-- Typescript type check shi*/ />
                <div className="grid gap-2">
                  <Label htmlFor="terms-2">Save Snapshot</Label>
                  <p className="text-muted-foreground text-sm">
                    Save current scan into new snapshot file
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <div className="w-full flex flex-row items-center justify-center gap-3">
              <Button variant="outline" onClick={() => runScan(selectedDisk)}>Scan</Button>
              <Progress></Progress>
            </div>
          </CardFooter>
        </Card>

        {/* Notifications card */}
        {/* <SplashNotifications></SplashNotifications> */}
      </div>
    </div>
  )
}

export default SplashPage