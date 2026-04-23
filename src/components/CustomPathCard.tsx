import React, { useState } from 'react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card'
import { Separator } from '@/components/ui/separator'
import CustomPath from './custom_path'
import { Button } from './ui/button'
import { Checkbox } from './ui/checkbox'
import { Label } from '@/components/ui/label'

import { invoke } from '@tauri-apps/api/core';
import { useErrorStore, userStore } from './store'
import Progress from './progress'

import { DirView } from '@/types'
import { useTranslation } from 'react-i18next'

interface SplashPageProps {
    setWhichField: React.Dispatch<React.SetStateAction<boolean>>;
}


const CustomPathCard: React.FC<SplashPageProps> = ({ setWhichField }) => {
    const { t } = useTranslation()

    // Card only needs to read the currently selected snapshot file global store obj?
    const [selectedPath, setSelectedPath] = useState<string>("");

    const snapshotFile = userStore((state) => state.prevSnapshotFilePath)

    const setCurrentBackendError = useErrorStore((state) => state.setCurrentBackendError)

    const runScan = async (target: string) => {
        try {
            const result = await invoke<DirView>('disk_scan', { target, snapshotFile, snapshotFlag: false }); // always flag set to false

            const zustandInitFunc = userStore.getState().initDirData;

            zustandInitFunc(result, target);

            setWhichField(false); // state switch to anallytics screen

        } catch (e) {
            setCurrentBackendError(e)
        }
    }


    return (
        <Card className='w-[28rem] p-7'>
            <CardHeader>
                <CardTitle>{t("scan.title")}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col space-y-5">
                    <p className="text-sm leading-none font-medium">{t("scan.fields.customPath")}</p>
                    <CustomPath value={selectedPath} onChange={setSelectedPath} />

                    <Separator></Separator>

                    {/* Dry run checkbox */}
                    <div className="flex items-start gap-3">
                        <Checkbox id="terms-2" checked={false} disabled={true}></Checkbox>
                        <div className="grid gap-2">
                            <Label htmlFor="terms-2">{t("scan.options.compareSnapshots")}</Label>
                            <p className="text-muted-foreground text-sm">
                                {t("scan.options.compareSnapshotsDescription")}
                            </p>
                        </div>
                    </div>

                    <Separator></Separator>

                    <div className="flex items-start gap-3">
                        <Checkbox id="terms-2" checked={false} disabled={true}></Checkbox>
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
                    <Button variant="outline" onClick={() => runScan(selectedPath)}>{t("scan.actions.scan")}</Button>
                    <Progress></Progress>
                </div>
            </CardFooter>
        </Card>
    )
}

export default CustomPathCard
