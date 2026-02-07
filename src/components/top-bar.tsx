import { userStore } from './store'
import { Badge } from './ui/badge'
import { SettingsPage } from './sheet-demo'
import { NotificationCenter } from './NotificationCenter'
import { Button } from './ui/button'
import { ArrowLeft } from 'lucide-react'

interface TopBarProps {
  onHomeClick?: () => void;
}

const TopBar = ({ onHomeClick }: TopBarProps) => {
    const currentPath = userStore((state) => state.currentPath)
    const currentEntryDetails = userStore((state) => state.currentEntryDetail)
    let numsubdir = currentEntryDetails.numsubdir ? String(currentEntryDetails.numsubdir) : ("0");
    let numsubfile = currentEntryDetails.numsubfile ? String(currentEntryDetails.numsubfile) : ("0");

  return (
    <div className='flex flex-row items-center justify-between w-full pl-2 pr-2 pb-1 pt-1 bg-stone-800'>
        <div className="flex flex-row items-center gap-x-2">

            {onHomeClick && (
                <Button variant="outline" size="icon" onClick={onHomeClick} className="h-7 w-7">
                    <ArrowLeft className="h-4 w-4" />
                </Button>
            )}

            {/* <Menubar className="z-50">
                <MenubarMenu>
                <MenubarTrigger className="text-xs">File</MenubarTrigger>
                <MenubarContent>
                    <MenubarItem>
                    New Tab <MenubarShortcut>⌘T</MenubarShortcut>
                    </MenubarItem>
                    <MenubarItem>New Window</MenubarItem>
                    <MenubarSeparator />
                    <MenubarItem>Share</MenubarItem>
                    <MenubarSeparator />
                    <MenubarItem>Print</MenubarItem>
                </MenubarContent>
                </MenubarMenu>

                <MenubarMenu>
                <MenubarTrigger className="text-xs">Edit</MenubarTrigger>
                <MenubarContent>
                    <MenubarItem>
                    Undo <MenubarShortcut>⌘Z</MenubarShortcut>
                    </MenubarItem>
                    <MenubarItem>
                    Redo <MenubarShortcut>⇧⌘Z</MenubarShortcut>
                    </MenubarItem>
                </MenubarContent>
                </MenubarMenu>
            </Menubar> */}

            {/* <InfoFlagBar></InfoFlagBar> */}

            <div>
                <Badge className="h-5 min-w-5 rounded-full px-1 text-sm font-mono text-yellow-500 tabular-nums"
                variant="outline">
                    {`Subdir: ${numsubdir} Subfiles: ${numsubfile}`}
                </Badge>
                <Badge className="h-5 min-w-5 rounded-full px-1 font-mono tabular-nums"
                variant="outline">
                    {currentPath}
                </Badge>
            </div>

        </div>

        <div className="flex flex-row items-center gap-x-2">
            <NotificationCenter></NotificationCenter>
            <SettingsPage></SettingsPage>
        </div>
    </div>
  )
}

export default TopBar