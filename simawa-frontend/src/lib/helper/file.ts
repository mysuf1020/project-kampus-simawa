'use client'

type FileExtensions = '.png' | '.jpg' | '.jpeg' | '.pdf' | '.xls' | '.xlsx' | '.csv'

const imageExtensions: string[] = ['image/png', 'image/jpg', 'image/jpeg']
const applicationExtensions: string[] = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
]

const pdfExtension = ['application/pdf']

export const fetchPdfFromUrl = (url: string) => {
  return new Promise<string>((resolve, reject) => {
    fetch(url).then(async (response) => {
      const blob = await response.blob()
      const objectUrl = await blobToURL(blob)
      if (typeof objectUrl === 'string') {
        resolve(objectUrl)
        return
      }
      reject(null)
    })
  })
}

function blobToURL(blob: Blob) {
  return new Promise<string | ArrayBuffer | null>((resolve) => {
    const reader = new FileReader()
    reader.readAsDataURL(blob)
    reader.onloadend = function () {
      const base64data = reader.result
      resolve(base64data)
    }
  })
}

// the key is an extension from a file, while the value is a [File].type on a File instance
const fileTypes: {
  [key: string]: string
} = {
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.jpeg': 'image/jpeg',
  '.pdf': 'application/pdf',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.csv': 'text/csv',
}

const isFileAllowed = (file: File, extensions: FileExtensions[]): boolean => {
  if (extensions.includes('.csv')) {
    const t = file.type
    if (
      t === 'text/csv' ||
      t === 'application/vnd.ms-excel' ||
      /\.csv$/i.test(file.name)
    ) {
      return true
    }
  }
  const allowedTypes = extensions
    .map((extension) => fileTypes[extension])
    .filter((extension) => extension)

  return allowedTypes.includes(file.type)
}

const fetchImageUrl = (
  url: string,
  name: string = '[file]',
  signal?: AbortSignal,
): Promise<File> =>
  new Promise<File>((resolve, reject) => {
    fetch(url, { signal })
      .then((response) => {
        if (response.ok) {
          return response.blob()
        } else {
          throw new Error('Invalid image URL')
        }
      })
      .then((blob) => {
        const ext = getExtensionFromBlobType(blob.type)
        const fileName = name.endsWith(`.${ext}`) ? name : `${name}.${ext}`
        const file = new File([blob], fileName, { type: blob.type })
        resolve(file)
      })
      .catch((error) => {
        reject(error)
      })
  })

function getExtensionFromBlobType(blobType: string): string {
  const typeMap: {
    [key: string]: string
  } = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'video/mp4': 'mp4',
    'video/webm': 'webm',
    'audio/mpeg': 'mp3',
    'audio/ogg': 'ogg',
    'text/plain': 'txt',
    'application/pdf': 'pdf',
    'application/zip': 'zip',
  }

  const trimmedBlobType = blobType.split(';')[0]
  return typeMap[trimmedBlobType] || ''
}

export const downloadBlob = (stringData: string, fileName: string, type: string) => {
  const blob = new Blob([stringData], { type })

  const link = document.createElement('a')
  link.href = window.URL.createObjectURL(blob)
  link.download = fileName

  link.click()
  window.URL.revokeObjectURL(link.href)
}

export const downloadQR = (elementId: string, fileName: string) => {
  const element = document.getElementById(elementId)
  if (!element) {
    return
  }
  const stringData = new XMLSerializer().serializeToString(element)
  const svgBlob = new Blob([stringData], {
    type: 'image/svg+xml;charset=utf-8',
  })
  const dom = window.URL || window.webkitURL || window
  const url = dom.createObjectURL(svgBlob)

  const image = new Image()
  image.width = element!.clientWidth
  image.height = element!.clientHeight
  image.src = url

  image.onload = () => {
    const canvas = document.createElement('canvas')
    canvas.width = image.width
    canvas.height = image.height

    const context = canvas.getContext('2d')
    context?.drawImage(image, 0, 0)
    dom.revokeObjectURL(url)

    const imgURI = canvas
      .toDataURL('image/png')
      .replace('image/png', 'image/octet-stream')
    const a = document.createElement('a')
    a.download = fileName
    a.href = imgURI
    a.click()
  }
}

export {
  fileTypes,
  isFileAllowed,
  type FileExtensions,
  imageExtensions,
  applicationExtensions,
  pdfExtension,
  fetchImageUrl,
  getExtensionFromBlobType,
}
