'use client'

import { atom, useAtom } from 'jotai'
import { z } from 'zod'

export type SuratCreateStep = 0 | 1 | 2

export type SuratSigner = {
  role: string
  name: string
  nip: string
}

export type SuratCreateForm = {
  orgId: string

  // Meta
  number: string
  subject: string
  lampiran: string
  placeAndDate: string

  // Header
  useCustomHeader: boolean

  // Header lines
  headerOrgName: string
  headerOrgUnit: string
  headerAddress: string
  headerPhone: string
  headerLeftLogo: string
  headerRightLogo: string

  // Recipient
  toRole: string
  toName: string
  toPlace: string
  toCity: string

  // Body
  opening: string
  body: string
  closing: string

  // Tembusan (multiline text, dipisah newline)
  tembusan: string

  // Signers
  signers: SuratSigner[]
}

const initialCreateForm: SuratCreateForm = {
  orgId: '',
  number: '',
  subject: '',
  lampiran: '',
  placeAndDate: '',
  useCustomHeader: false,
  headerOrgName: '',
  headerOrgUnit: '',
  headerAddress: '',
  headerPhone: '',
  headerLeftLogo: '',
  headerRightLogo: '',
  toRole: '',
  toName: '',
  toPlace: '',
  toCity: '',
  opening: '',
  body: '',
  closing: '',
  tembusan: '',
  signers: [
    {
      role: '',
      name: '',
      nip: '',
    },
  ],
}

// Zod Schema for validation
export const suratSchema = z.object({
  orgId: z.string().min(1, 'Organisasi wajib dipilih'),
  subject: z.string().min(1, 'Perihal wajib diisi'),
  placeAndDate: z.string().min(1, 'Tempat & tanggal wajib diisi'),
  // Step 2 validation
  toRole: z.string().optional(), // Flexible
  toName: z.string().optional(),
  body: z.string().min(10, 'Isi surat minimal 10 karakter'),
  // Step 3 validation
  signers: z
    .array(
      z.object({
        role: z.string().min(1, 'Jabatan wajib diisi'),
        name: z.string().min(1, 'Nama wajib diisi'),
        nip: z.string().optional(),
      })
    )
    .min(1, 'Minimal satu penandatangan'),
})

export type SuratValidationErrors = Record<string, string>

export const suratCreateStepAtom = atom<SuratCreateStep>(0)
export const suratCreateFormAtom = atom<SuratCreateForm>(initialCreateForm)
export const suratCreateErrorsAtom = atom<SuratValidationErrors>({})

export const useSuratCreateState = () => {
  const [step, setStep] = useAtom(suratCreateStepAtom)
  const [form, setForm] = useAtom(suratCreateFormAtom)
  const [errors, setErrors] = useAtom(suratCreateErrorsAtom)

  const validateStep = (currentStep: number): boolean => {
    const newErrors: SuratValidationErrors = {}
    let isValid = true

    if (currentStep === 0) {
      if (!form.orgId) {
        newErrors.orgId = 'Organisasi wajib dipilih'
        isValid = false
      }
      if (!form.subject) {
        newErrors.subject = 'Perihal wajib diisi'
        isValid = false
      }
      if (!form.placeAndDate) {
        newErrors.placeAndDate = 'Tempat & tanggal wajib diisi'
        isValid = false
      }
    } else if (currentStep === 1) {
      if (!form.body || form.body.length < 10) {
        newErrors.body = 'Isi surat wajib diisi (min. 10 karakter)'
        isValid = false
      }
      if (!form.toRole && !form.toName) {
         // At least one recipient info
         newErrors.toRole = 'Minimal jabatan atau nama penerima diisi'
         isValid = false
      }
    } else if (currentStep === 2) {
       form.signers.forEach((s, idx) => {
         if (!s.role) {
           newErrors[`signers.${idx}.role`] = 'Jabatan wajib diisi'
           isValid = false
         }
         if (!s.name) {
           newErrors[`signers.${idx}.name`] = 'Nama wajib diisi'
           isValid = false
         }
       })
    }

    setErrors(newErrors)
    return isValid
  }

  const goNext = () => {
    if (validateStep(step)) {
      setStep((prev) => (prev < 2 ? ((prev + 1) as SuratCreateStep) : prev))
    }
  }

  const goPrev = () => {
    setErrors({}) // Clear errors when going back
    setStep((prev) => (prev > 0 ? ((prev - 1) as SuratCreateStep) : prev))
  }

  const reset = () => {
    setForm(initialCreateForm)
    setStep(0)
    setErrors({})
  }

  return {
    step,
    setStep,
    form,
    setForm,
    errors,
    setErrors,
    goNext,
    goPrev,
    reset,
    validateStep,
  }
}
