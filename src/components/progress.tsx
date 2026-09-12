import { useEffect, useState } from 'react'
import { listen } from '@tauri-apps/api/event'
import { Spinner } from './ui/spinner';
import { Badge } from './ui/badge';
const Progress = () => {

  const [entryProgress, setEntryProgress] = useState(0); // just a number

  const getTotalCount = async () => {
    // here call the total count helper function to get total amount of valid items from BE
    // use it to do the progress tracker
  }

  useEffect(() => {

    // listen will make the listener and return a deregister listener function

    const unlisten = listen<number>('progress', (event) => {
      // console.log(event.payload);
      setEntryProgress(event.payload);
    })

    // on unmount cleanup
    return () => {
      unlisten.then(unlisten => unlisten());
    }
  }, []);

  return (
    <div>
      { // if entry init is 0 so no show if a scan starts to be emitted show it
        entryProgress > 0 &&

        <Badge variant="outline" className="text-base gap-2">
          <Spinner className='size-10 text-purple-500'></Spinner>
          {entryProgress}
        </Badge>
      }
    </div>
  )
}

export default Progress