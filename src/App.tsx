import React, { useState } from 'react'
import SplashPage from '@/components/splash_page'
import { ThemeProvider } from './components/theme-provider'
import Analytics from './components/analytics'

const App = () => {

  const [whichField, setWhichField] = useState<boolean>(true);

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">

      {whichField ? (
        <SplashPage setWhichField={setWhichField}></SplashPage>
      ) : (
        <Analytics setWhichField={setWhichField}></Analytics>
      )}
    </ThemeProvider>
  )
}

export default App