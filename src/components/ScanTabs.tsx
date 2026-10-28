import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import { Checkbox, Label } from "radix-ui"
import CustomPath from "./custom_path"
import DiskPath from "./disk_path"
import { Button } from "./ui/button"
import Progress from './progress'
import FullDiskCard from "./FullDiskCard"
import CustomPathCard from "./CustomPathCard"
import CompareSnapshotsCard from "./CompareSnapshotsCard"

interface SplashPageProps {
    setWhichField: React.Dispatch<React.SetStateAction<boolean>>;
}

export function ScanTabs({ setWhichField }) {
    return (
        <Tabs defaultValue="fulldisk" className="w-[400px]">
            <TabsList>
                <TabsTrigger value="fulldisk">Full Disk</TabsTrigger>
                <TabsTrigger value="custompath">Custom Path</TabsTrigger>
                <TabsTrigger value="comparesnapshots">Compare Snapshots</TabsTrigger>
            </TabsList>
            <TabsContent value="fulldisk">
                <FullDiskCard setWhichField={setWhichField}></FullDiskCard>
            </TabsContent>
            <TabsContent value="custompath">
                <CustomPathCard setWhichField={setWhichField}></CustomPathCard>
            </TabsContent>
            <TabsContent value="comparesnapshots">
                <CompareSnapshotsCard setWhichField={setWhichField}></CompareSnapshotsCard>
            </TabsContent>
        </Tabs>
    )
}
