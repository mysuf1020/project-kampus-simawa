'use client'

import { atom, useAtom } from 'jotai'

export type SuratDraftStep = 'FORM' | 'REVIEW'

export type SuratDraftForm = {
  variant: 'UNDANGAN' | 'PEMINJAMAN' | 'PENGAJUAN' | 'PERMOHONAN'
  title: string
  body: string
  number: string
  lampiran: string
  toRole: string
  toName: string
  toPlace: string
  toCity: string
  placeAndDate: string
  opening: string
  closing: string
  signer1Role: string
  signer1Name: string
  signer1Nip: string
}

const initialDraft: SuratDraftForm = {
  variant: 'UNDANGAN',
  title: '',
  body: '',
  number: '',
  lampiran: '',
  toRole: '',
  toName: '',
  toPlace: '',
  toCity: '',
  placeAndDate: '',
  opening: '',
  closing: '',
  signer1Role: '',
  signer1Name: '',
  signer1Nip: '',
}

export const suratDraftStepAtom = atom<SuratDraftStep>('FORM')
export const suratDraftFormAtom = atom<SuratDraftForm>(initialDraft)

export const useSuratDraftState = () => {
  const [step, setStep] = useAtom(suratDraftStepAtom)
  const [draft, setDraft] = useAtom(suratDraftFormAtom)

  const goToForm = () => setStep('FORM')
  const goToReview = () => setStep('REVIEW')
  const resetDraft = () => {
    setDraft(initialDraft)
    setStep('FORM')
  }

  return {
    step,
    draft,
    setDraft,
    goToForm,
    goToReview,
    resetDraft,
  }
}
