import { Session } from '@supabase/supabase-js'
import { useOutletContext } from 'react-router-dom'
import { Perfil } from '../hooks/usePerfil'

export interface LayoutCtx {
  session: Session
  perfil: Perfil | null
  isAdmin: boolean
}

export function useLayoutCtx() {
  return useOutletContext<LayoutCtx>()
}
