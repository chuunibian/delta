import React, { useState } from 'react'

import { Label } from "@/components/ui/label"
import { Button } from './ui/button'
import { open } from '@tauri-apps/plugin-dialog'
import { useErrorStore } from './store'
import { invoke } from '@tauri-apps/api/core';

export function SnapshotFolderCard() {
    const setCurrentBackendError = useErrorStore((state) => state.setCurrentBackendError)

    const [copied, setCopied] = useState(false);
    
    const handleOpenDialog = async () => {
        try {
            const path: string = await invoke('get_snapshot_storage_path')
            await navigator.clipboard.writeText(path)
            setCopied(true)
            setTimeout(() => setCopied(false), 1333)
        } catch (err) {
            setCurrentBackendError(err)
        }
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