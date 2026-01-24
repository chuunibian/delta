import { Card } from './ui/card'

const Dashboard = () => {
  return (

    <div className='flex items-center justify-center bg-stone-800'>
      <div className='flex h-screen w-full flex-row gap-2 p-2'>

        <Card className='flex-1 p-2'>
          <span>What</span>
        </Card>

        <div className='flex flex-1 flex-col gap-2'>

            <Card className='flex-1 p-10'>

            </Card>

            <Card className='flex-1 p-10'>

            </Card>
        </div>
      </div>
    </div>
  )
}

export default Dashboard