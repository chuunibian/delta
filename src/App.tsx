// import React from 'react'
// import SplashPage from '@/components/splash_page'
// import { ThemeProvider } from './components/theme-provider'
// import Dashboard from './components/dashboard'
// import Analytics from './components/analytics'

// const App = () => {
//   return (
//     <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
//       <SplashPage></SplashPage>
//       <Dashboard></Dashboard>
//       <Analytics></Analytics>
//     </ThemeProvider>
//   )
// }

// export default App


import React, { useState } from 'react'
import SplashPage from '@/components/splash_page'
import { ThemeProvider } from './components/theme-provider'
import Dashboard from './components/dashboard'
import Analytics from './components/analytics'
import FullScreenSkeleton from './components/tempskeleton'

const App = () => {

  const [whichField, setWhichField] = useState<boolean>(true);

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      {/* <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center backdrop-blur-sm"> */}
      {/* <div className="fixed inset-0 z-51 flex flex-col items-center justify-center"> */}
        {/* <SplashPage setWhichField={setWhichField}></SplashPage> */}
      {/* </div> */}
      {/* <FullScreenSkeleton></FullScreenSkeleton> */}
      {/* <Analytics></Analytics> */}
      {whichField ? (<SplashPage setWhichField={setWhichField}></SplashPage>) : (<Analytics></Analytics>)}
    </ThemeProvider>
  )
}

export default App