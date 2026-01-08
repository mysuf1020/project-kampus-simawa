'use client'

import { atom, useAtom } from 'jotai'

export const showOnlyUnreadNotificationsAtom = atom<boolean>(true)

export const useNotificationsFilter = () => {
  const [showOnlyUnread, setShowOnlyUnread] = useAtom(showOnlyUnreadNotificationsAtom)
  return { showOnlyUnread, setShowOnlyUnread }
}
