'use client'

import { FC, useMemo, useState } from 'react'
import { Document, Page } from 'react-pdf'
import type { DocumentCallback } from 'react-pdf/dist/shared/types.js'

import 'react-pdf/dist/Page/TextLayer.css'
import 'react-pdf/dist/Page/AnnotationLayer.css'

export type PDFFile = File | Blob | string | null

type PDFViewerProps = {
  pdfFile: PDFFile
  className?: string
  width?: number
}

const InternalPDFViewer: FC<PDFViewerProps> = ({ pdfFile, width, className }) => {
  const [numPages, setNumPages] = useState<number>(0)

  const file = useMemo<PDFFile>(() => pdfFile, [pdfFile])

  const onLoadSuccess = (doc: DocumentCallback) => {
    setNumPages(doc.numPages || 0)
  }

  if (!file) {
    return (
      <div className={className}>
        <p className="text-xs text-neutral-400">Tidak ada preview PDF.</p>
      </div>
    )
  }

  const fileKey =
    file instanceof File
      ? file.name
      : file instanceof Blob
        ? `blob-${file.size}-${file.type}`
        : String(file)

  return (
    <div className={className}>
      <Document
        key={fileKey}
        file={file}
        onLoadSuccess={onLoadSuccess}
        loading={
          <p className="p-4 text-xs text-neutral-500">Mengunduh dan memuat PDF...</p>
        }
        onLoadError={(err) => {
          console.error('PDF load error', err)
        }}
        onSourceError={(err) => {
          console.error('PDF source error', err)
        }}
      >
        {Array.from({ length: Math.max(numPages, 1) }).map((_, idx) => (
          <Page
            key={`page_${idx + 1}`}
            pageNumber={idx + 1}
            width={width}
            renderTextLayer={false}
            renderAnnotationLayer={false}
          />
        ))}
      </Document>
    </div>
  )
}

export default InternalPDFViewer
