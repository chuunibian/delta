import { Alert, AlertDescription, AlertTitle } from './ui/alert'
import { Card, CardContent } from './ui/card'
import { ArchiveIcon, AlertCircleIcon } from 'lucide-react'

const SplashNotifications = () => {
  return (
    <Card className='w-[28rem] p-4'>
      <CardContent>

        <div className='flex flex-col gap-4 p-3'>

        <Alert>
            <ArchiveIcon/>
            <AlertTitle>
                Last Scan Info
            </AlertTitle>
            <AlertDescription>
                ""

            </AlertDescription>
        </Alert>

        <Alert>
            <ArchiveIcon/>
            <AlertTitle>
                Disk Size History
            </AlertTitle>
            <AlertDescription>
                ""

            </AlertDescription>
        </Alert>

        <Alert variant="destructive">
            <AlertCircleIcon />
            <AlertTitle>
                Alerts
            </AlertTitle>
            <AlertDescription>
                ""
            </AlertDescription>
        </Alert>


        <Alert variant="destructive">
            <AlertCircleIcon />
            <AlertTitle>
                Alerts
            </AlertTitle>
            <AlertDescription>
                ""
            </AlertDescription>
        </Alert>

        </div>
      </CardContent>
    </Card>
  )
}

export default SplashNotifications