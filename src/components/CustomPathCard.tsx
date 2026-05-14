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
import { ScanTabs } from './ScanTabs'

interface SplashPageProps {
    setWhichField: React.Dispatch<React.SetStateAction<boolean>>;
}


const CustomPathCard: React.FC<SplashPageProps> = ({ setWhichField }) => {

    // Card only needs to read the currently selected snapshot file global store obj?
    const [selectedPath, setSelectedPath] = useState<string>("");

    const snapshotFile = userStore((state) => state.prevSnapshotFilePath)

    const setCurrentBackendError = useErrorStore((state) => state.setCurrentBackendError)

    const [scanButtonState, setScanButtonState] = useState<boolean>(false); // false = not scan, true = scan TODO

    const runScan = async (target: string) => {
        if (scanButtonState) return;

        try {

            setScanButtonState(true)

            const result = await invoke<DirView>('disk_scan', { target, snapshotFile, snapshotFlag: false }); // always flag set to false

            const zustandInitFunc = userStore.getState().initDirData;

            zustandInitFunc(result, target);

            setWhichField(false); // state switch to anallytics screen

        } catch (e) {
            setCurrentBackendError(e)
        } finally {
            setScanButtonState(false)
        }
    }


    return (
        <Card className='w-[28rem] p-7'>
            <CardHeader>
                <CardTitle>Start Snapshot</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col space-y-5">
                    <p className="text-sm leading-none font-medium">Custom Path</p>
                    <CustomPath value={selectedPath} onChange={setSelectedPath} />

                    <Separator></Separator>

                    {/* Dry run checkbox */}
                    <div className="flex items-start gap-3">
                        <Checkbox id="terms-2" checked={false} disabled={true}></Checkbox>
                        <div className="grid gap-2">
                            <Label htmlFor="terms-2">Compare Snapshots</Label>
                            <p className="text-muted-foreground text-sm">
                                Compare current scan with previous scanned snapshot
                            </p>
                        </div>
                    </div>

                    <Separator></Separator>

                    <div className="flex items-start gap-3">
                        <Checkbox id="terms-2" checked={false} disabled={true}></Checkbox>
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
                    <Button variant="outline" disabled={scanButtonState} onClick={() => runScan(selectedPath)}>Scan</Button>
                    <Progress></Progress>
                </div>
            </CardFooter>
        </Card>
    )
}

export default CustomPathCard