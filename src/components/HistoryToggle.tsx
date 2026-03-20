import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useConfigurationStore } from "./store"
import { Activity } from "lucide-react"

export function HistoryToggle() {
    const setShowHistory = useConfigurationStore((state) => state.setShowHistory)
    const showHistoryFlag = useConfigurationStore((state) => state.ShowHistory)

    return (
        <div className="flex flex-row items-center justify-between rounded-lg border bg-card p-4 shadow-sm">
            <div className="space-y-1">
                <Label htmlFor="history-mode" className="text-base font-medium flex items-center gap-2">
                    History Graph
                </Label>
                <p className="text-[0.8rem] text-muted-foreground">
                    Enable the historical size graph when viewing directory entries.
                </p>
            </div>
            <Switch
                id="history-mode"
                checked={showHistoryFlag}
                onCheckedChange={setShowHistory}
            />
        </div>
    )
}
