'use client'

import { atom, useAtom } from 'jotai'

export const lpjOrgIdAtom = atom<string>('')

export const useLPJOrgState = () => {
  const [orgId, setOrgId] = useAtom(lpjOrgIdAtom)
  return { orgId, setOrgId }
}
