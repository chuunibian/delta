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
import { useTranslation } from "react-i18next"

interface SplashPageProps {
    setWhichField: React.Dispatch<React.SetStateAction<boolean>>;
}

export function ScanTabs({ setWhichField }) {
    const { t } = useTranslation()
    return (
        <Tabs defaultValue="fulldisk" className="w-[400px]">
            <TabsList>
                <TabsTrigger value="fulldisk">{t("scan.tabs.fullDisk")}</TabsTrigger>
                <TabsTrigger value="custompath">{t("scan.tabs.customPath")}</TabsTrigger>
            </TabsList>
            <TabsContent value="fulldisk">
                <FullDiskCard setWhichField={setWhichField}></FullDiskCard>
            </TabsContent>
            <TabsContent value="custompath">
                <CustomPathCard setWhichField={setWhichField}></CustomPathCard>
            </TabsContent>
        </Tabs>
    )
}
