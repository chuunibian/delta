import React from 'react'
import { Progress } from './ui/progress'

const LoadingBar = () => {
    const [progress, setProgress] = React.useState(13)

    React.useEffect(() => {
        const timer = setTimeout(() => setProgress(66), 500)
        return () => clearTimeout(timer)
    }, [])

    return (
    <Progress value={progress} className="w-full" />
    )
}

export default LoadingBar