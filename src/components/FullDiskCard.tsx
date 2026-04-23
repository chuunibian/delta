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

import Progress from './progress'

import { DirView, InitDisk } from '@/types'
import { useTranslation } from 'react-i18next'


interface SplashPageProps {
    setWhichField: React.Dispatch<React.SetStateAction<boolean>>;
}


const FullDiskCard: React.FC<SplashPageProps> = ({ setWhichField }) => {
    const { t } = useTranslation()

    const [disks, setDisks] = useState<InitDisk[]>([]);

    const [selectedDisk, setSelectedDisk] = useState<string>(""); // for full disk paths

    const [saveCurrentSnapshotFlag, setSaveCurrentSnapshotFlag] = useState<boolean>(true);

    const snapshotFlag = userStore((state) => state.snapshotFlag) // this flag is for if to save snapshot or not

    const setSnapshotFlag = userStore((state) => state.setSnapshotFlag)

    const snapshotFile = userStore((state) => state.prevSnapshotFilePath)

    const setCurrentBackendError = useErrorStore((state) => state.setCurrentBackendError)


    useEffect(() => {
        const getDisks = async () => {
            try {
                const result = await invoke<InitDisk[]>('retreive_disks', {});

                setDisks(result)

            } catch (err) {
                setCurrentBackendError(err)
                setDisks([{ name: t("scan.fallback.unknownDisk"), desc: t("scan.fallback.noDisksFound") }])
            }
        }

        getDisks();
    }, [setCurrentBackendError, t]);

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

            zustandInitFunc(result, target);

            setWhichField(false); // state switch to anallytics screen

        } catch (e) {
            setCurrentBackendError(e)
            console.log(e)
        }
    }


    return (
        <Card className='w-[28rem] p-7'>
            <CardHeader>
                <CardTitle>{t("scan.title")}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col space-y-5">
                    <p className="text-sm leading-none font-medium">{t("scan.fields.disk")}</p>
                    <DiskPath disks={disks} onValueChange={setSelectedDisk}></DiskPath>

                    <Separator></Separator>

                    {/* Dry run checkbox */}
                    <div className="flex items-start gap-3">
                        <Checkbox id="terms-2" disabled={snapshotFile === ""} checked={snapshotFlag} onCheckedChange={setSnapshotFlag} />
                        <div className="grid gap-2">
                            <Label htmlFor="terms-2">{t("scan.options.compareSnapshots")}</Label>
                            <p className="text-muted-foreground text-sm">
                                {t("scan.options.compareSnapshotsDescription")}
                            </p>
                        </div>
                    </div>

                    <Separator></Separator>

                    <div className="flex items-start gap-3">
                        <Checkbox id="terms-2" checked={saveCurrentSnapshotFlag} onCheckedChange={(checked) => setSaveCurrentSnapshotFlag(checked === true)} /*<-- Typescript type check shi*/ />
                        <div className="grid gap-2">
                            <Label htmlFor="terms-2">{t("scan.options.saveSnapshot")}</Label>
                            <p className="text-muted-foreground text-sm">
                                {t("scan.options.saveSnapshotDescription")}
                            </p>
                        </div>
                    </div>
                </div>
            </CardContent>
            <CardFooter>
                <div className="w-full flex flex-row items-center justify-center gap-3">
                    <Button variant="outline" onClick={() => runScan(selectedDisk)}>{t("scan.actions.scan")}</Button>
                    <Progress></Progress>
                </div>
            </CardFooter>
        </Card>
    )
}

export default FullDiskCard
