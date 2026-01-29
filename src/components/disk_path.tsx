
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { InitDisk } from "@/types";


interface DiskPathProp {
  disks: InitDisk[];
  onValueChange: (value: string) => void; // callback func
}


// NOTE THAT FOR SHADE CN THE VALUEPROP PASSED TO THE SLECET ITEM IS THE KEY IT MANAGE IT ITSELF!!
// THAT ALSO creates repated slectitems each with the value and the value is waht is propogated up on change
const DiskPath = ({ disks, onValueChange }: DiskPathProp)  => {
  return (
    <>
        <Select onValueChange={onValueChange}>
          <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select a disk" />
          </SelectTrigger>
          <SelectContent>
              <SelectGroup>
              {disks.map((disk) => (
                <SelectItem key={disk.name} value={disk.name}>
                  {disk.desc} 
                </SelectItem>
              ))}
              </SelectGroup>
          </SelectContent>
        </Select>
    </>
  )
}

export default DiskPath