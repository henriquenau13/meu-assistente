import { createContext, useContext } from 'react'

export const EyesContext = createContext({
  reaction: null,
  react: () => {},
  calm: () => {},
})

// Use dentro de qualquer componente:  const { react } = useEyes()
export const useEyes = () => useContext(EyesContext)