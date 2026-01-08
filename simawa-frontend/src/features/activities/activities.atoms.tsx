'use client'

import { atom, useAtom } from 'jotai'

export const activityOrgIdAtom = atom<string>('')

export const useActivityOrgState = () => {
  const [orgId, setOrgId] = useAtom(activityOrgIdAtom)
  return { orgId, setOrgId }
}
