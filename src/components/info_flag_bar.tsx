import { Badge } from './ui/badge'
import React from 'react'

const InfoFlagBar = () => {
  return (
    <div>
        <Badge variant='outline'>
            <div className='flex flex-row gap-1 items-center'>
            <Badge variant='destructive' className='text-white text-[10px] h-3 w-4 p-0'>
                G
            </Badge>
            <Badge className='bg-blue-500 text-white text-[10px] h-3 w-4 p-0' >
                B
            </Badge>
            <Badge className='h-3 w-4 bg-green-500 text-white text-[10px]'>
                N
            </Badge>

            </div>
            {/* <div className='flex flex-row gap-1 items-center'>
                <div className="h-1.5 w-1.5 rounded-full bg-green-500" title="New File"></div>
                <div className="h-1.5 w-1.5 rounded-full bg-green-500" title="New File"></div>
                <div className="h-1.5 w-1.5 rounded-full bg-green-500" title="New File"></div>
            </div> */}
        

        </Badge>

    </div>
  )
}

export default InfoFlagBar