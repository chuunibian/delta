import { MenubarShortcut } from './ui/menubar'
import { ArrowLeftIcon, ArrowRightIcon } from 'lucide-react'
import { Button } from './ui/button'
import { ButtonGroup } from './ui/button-group'
import { Menubar, MenubarMenu, MenubarTrigger, MenubarContent, MenubarItem, MenubarSeparator } from './ui/menubar'
import { Spinner } from './ui/spinner'
import { userStore } from './store'
import { Badge } from './ui/badge'
import InfoFlagBar from './info_flag_bar'
import { Sheet } from './ui/sheet'
import { SettingsPage } from './sheet-demo'


const TopBar = () => {
    const currentPath = userStore((state) => state.currentPath)
    const currentEntryDetails = userStore((state) => state.currentEntryDetail)
    let numsubdir = currentEntryDetails.numsubdir ? String(currentEntryDetails.numsubdir) : ("0");
    let numsubfile = currentEntryDetails.numsubfile ? String(currentEntryDetails.numsubfile) : ("0");

  return (
    <div className='flex flex-row items-center justify-between w-full pl-2 pr-2 bg-stone-800'>


        <div className="flex flex-row items-center gap-x-3">

        <Menubar className="z-50">
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
        </Menubar>

        {/* <InfoFlagBar></InfoFlagBar> */}

        {/* Temporary hover over path thingy*/}
            <div>
                <Badge className="h-5 min-w-5 rounded-full px-1 font-mono text-yellow-500 tabular-nums"
                variant="outline">
                    {`Subdir: ${numsubdir} Subfiles: ${numsubfile}`}
                </Badge>
                <Badge className="h-5 min-w-5 rounded-full px-1 font-mono tabular-nums"
                variant="outline">
                    {currentPath}
                </Badge>

            </div>

        </div>

        <div className="flex flex-row items-center gap-x-3">

            {/* <Spinner /> */}

            <SettingsPage></SettingsPage>

            {/* <ButtonGroup>
            <Button variant="outline" size="icon-sm" aria-label="Previous">
            <ArrowLeftIcon className="w-2 h-2" />       
            </Button>
            <Button variant="outline" size="icon-sm" aria-label="Next">
            <ArrowRightIcon className="w-2 h-2" />
            </Button>
            </ButtonGroup> */}

        </div>
    </div>
  )
}

export default TopBar