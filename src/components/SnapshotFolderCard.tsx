import React, { useState, useEffect } from 'react'

import { Label } from "@/components/ui/label"
import { Button } from './ui/button'
import { useErrorStore } from './store'
import { invoke } from '@tauri-apps/api/core';

export function SnapshotFolderCard() {
    // Fetch once on load of component then store path as state prevent fetch each time
    const setCurrentBackendError = useErrorStore((state) => state.setCurrentBackendError)

    const [copied, setCopied] = useState(false);
    const [snapshotPath, setSnapshotPath] = useState<string | null>(null);

    useEffect(() => {
        invoke<string>('get_snapshot_storage_path')
            .then(setSnapshotPath)
            .catch(setCurrentBackendError)
    }, [])

    const handleOpenDialog = () => {
        if (!snapshotPath) return
        navigator.clipboard.writeText(snapshotPath)
        setCopied(true)
        setTimeout(() => setCopied(false), 1333)
    }

    return (
        <div className="flex flex-row items-center justify-between rounded-lg border bg-card p-4 shadow-sm">
            <div className="space-y-1">
                <Label htmlFor="history-mode" className="text-base font-medium flex items-center gap-2">
                    Copy Snapshot Storage Path
                </Label>
                <p className="text-[0.8rem] text-muted-foreground">
                    Copy the path where snapshots are stored to clipboard.
                </p>
            </div>
            <Button onClick={handleOpenDialog} disabled={copied} >
                {copied ? "Copied..." : "Copy"}
            </Button>

        </div>
    )
}