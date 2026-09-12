import React, { useState } from 'react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card'
import { Separator } from '@/components/ui/separator'
import { Button } from './ui/button'
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

import { snapshotStore, useErrorStore, userStore } from './store'
import { SnapshotFile } from './data_table_columns'
import { formatBytes, formatDateTime } from '@/lib/utils'

interface CompareSnapshotsCardProps {
    setWhichField: React.Dispatch<React.SetStateAction<boolean>>;
}

// Matches the "{drive}_{date}_{size}" filename stem the backend uses to
// identify a snapshot (see snapshot_db_path in src-tauri/src/database.rs).
function snapshotKey(snapshot: SnapshotFile): string {
    return `${snapshot.drive_letter}_${snapshot.date_sort_key}_${snapshot.size}`
}

function snapshotLabel(snapshot: SnapshotFile): string {
    return `${snapshot.drive_letter} — ${formatDateTime(snapshot.date_time)} (${formatBytes(snapshot.size)})`
}

const CompareSnapshotsCard: React.FC<CompareSnapshotsCardProps> = ({ setWhichField }) => {

    const snapshotFiles = snapshotStore((state) => state.previousSnapshots)

    const setCurrentBackendError = useErrorStore((state) => state.setCurrentBackendError)

    const [baseSnapshotKey, setBaseSnapshotKey] = useState<string>("")
    const [comparisonSnapshotKey, setComparisonSnapshotKey] = useState<string>("")

    const [compareButtonState, setCompareButtonState] = useState<boolean>(false)

    const canCompare = baseSnapshotKey !== "" && comparisonSnapshotKey !== "" && baseSnapshotKey !== comparisonSnapshotKey

    const runCompare = async () => {
        if (compareButtonState || !canCompare) return

        try {
            setCompareButtonState(true)

            const rootLabel = `${baseSnapshotKey} vs ${comparisonSnapshotKey}`

            await userStore.getState().startSnapshotCompare(baseSnapshotKey, comparisonSnapshotKey, rootLabel)

            setWhichField(false) // state switch to analytics screen

        } catch (e) {
            setCurrentBackendError(e)
            console.error(e)
        } finally {
            setCompareButtonState(false)
        }
    }

    return (
        <Card className='w-[28rem] p-7'>
            <CardHeader>
                <CardTitle>Compare Snapshots</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col space-y-5">
                    <p className="text-sm leading-none font-medium">Base snapshot</p>
                    <Select onValueChange={setBaseSnapshotKey}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a snapshot" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                {snapshotFiles.map((snapshot) => (
                                    <SelectItem key={snapshotKey(snapshot)} value={snapshotKey(snapshot)}>
                                        {snapshotLabel(snapshot)}
                                    </SelectItem>
                                ))}
                            </SelectGroup>
                        </SelectContent>
                    </Select>

                    <Separator></Separator>

                    <p className="text-sm leading-none font-medium">Compare against</p>
                    <Select onValueChange={setComparisonSnapshotKey}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a snapshot" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                {snapshotFiles.map((snapshot) => (
                                    <SelectItem key={snapshotKey(snapshot)} value={snapshotKey(snapshot)}>
                                        {snapshotLabel(snapshot)}
                                    </SelectItem>
                                ))}
                            </SelectGroup>
                        </SelectContent>
                    </Select>

                    {baseSnapshotKey !== "" && baseSnapshotKey === comparisonSnapshotKey && (
                        <p className="text-destructive text-sm">Pick two different snapshots to compare.</p>
                    )}

                    {snapshotFiles.length < 2 && (
                        <p className="text-muted-foreground text-sm">
                            Save at least two snapshots before comparing them against each other.
                        </p>
                    )}
                </div>
            </CardContent>
            <CardFooter>
                <div className="w-full flex flex-row items-center justify-center gap-3">
                    <Button variant="outline" disabled={compareButtonState || !canCompare} onClick={runCompare}>
                        Compare
                    </Button>
                </div>
            </CardFooter>
        </Card>
    )
}

export default CompareSnapshotsCard
