'use client'
import * as React from 'react'
import Image from 'next/image'
import dynamic from 'next/dynamic'

import { cn } from '@/lib/utils'
import { Button, Skeleton } from '@/components/ui'
import { humanizeSize } from '@/lib/helper/size'
import {
  isFileAllowed,
  FileExtensions,
  imageExtensions,
  pdfExtension,
  fetchImageUrl,
} from '@/lib/helper/file'

export const PDFViewer = dynamic(() => import('./pdf-viewer'), {
  ssr: false,
})

import { NoImage } from './no-image'
import Icon from '../icons'

type InputFileProps = Omit<React.ComponentProps<'input'>, 'accept' | 'onChange'> & {
  helperText?: React.ReactNode
  onChange?: (file?: File) => void
  defaultFile?: File
  onClear?: () => void
  maxSize?: number
  acceptedFormats?: FileExtensions[]
  mode?: 'read' | 'edit' | 'upload'
}

type InputFileWrapper = Omit<InputFileProps, 'defaultFile'> & {
  defaultFile?: File | string
}

export type InputFileElement = HTMLInputElement & { removeFile: () => void }

/**
 * File input component with drag-and-drop support, file preview, and validation
 */
const InputFile = React.forwardRef<InputFileElement, InputFileWrapper>(
  ({ defaultFile, onChange, ...props }, forwardedRef) => {
    const isUrl = typeof defaultFile === 'string'
    const [currentFile, setCurrentFile] = React.useState<File | undefined>(
      isUrl ? undefined : defaultFile,
    )
    const [isFetching, setIsFetching] = React.useState(false)

    React.useEffect(() => {
      if (typeof defaultFile !== 'string') return
      setIsFetching(true)
      const controller = new AbortController()
      const signal = controller.signal
      const extractFileName = (url: string) => {
        const urlObj = new URL(url)
        return urlObj.pathname.split('/').pop() || 'file'
      }
      const fileName = extractFileName(defaultFile as string)
      fetchImageUrl(defaultFile as string, fileName, signal)
        .then((file) => {
          setCurrentFile(file)
          if (onChange) {
            onChange(file)
          }
          setIsFetching(false)
        })
        .catch((err) => {
          setCurrentFile(undefined)
          if (err.name !== 'AbortError') {
            setIsFetching(false)
          }
        })

      return () => {
        controller.abort()
      }
    }, [defaultFile, onChange])

    React.useEffect(() => {
      if (defaultFile instanceof File) {
        setCurrentFile(defaultFile)
      }
    }, [defaultFile, onChange])

    if (isFetching) {
      return <Skeleton className="w-[331px] !h-[178px]" />
    }
    return (
      <InputFileControl
        {...props}
        onChange={onChange}
        ref={forwardedRef}
        defaultFile={currentFile}
      />
    )
  },
)

/**
 * Internal control component that handles the actual file input and preview
 */
const InputFileControl = React.forwardRef<InputFileElement, InputFileProps>(
  (
    {
      className,
      helperText = 'Upload Document',
      onClear,
      acceptedFormats,
      defaultFile,
      maxSize,
      mode = 'edit',
      ...props
    },
    forwardedRef,
  ) => {
    const inputRef = React.useRef<HTMLInputElement>(null)
    const [selectedFile, setSelectedFile] = React.useState<File | undefined>(defaultFile)

    const clearFile = React.useCallback(() => {
      setSelectedFile(undefined)
      onClear?.()
    }, [setSelectedFile, onClear])

    React.useImperativeHandle(forwardedRef, () => ({
      ...(inputRef.current as HTMLInputElement),
      removeFile: clearFile,
    }))

    React.useEffect(() => {
      const currentRef = inputRef
      currentRef.current?.addEventListener('cancel', clearFile)
      return () => {
        currentRef.current?.removeEventListener('cancel', clearFile)
      }
    }, [clearFile])

    React.useEffect(() => {
      if (defaultFile && defaultFile !== selectedFile) {
        setSelectedFile(defaultFile)
      }
    }, [defaultFile, selectedFile])

    const validateAndSetFile = (files: FileList | null | undefined) => {
      if (!files?.[0]) return

      // if (maxSize && files[0].size > maxSize) return
      if (acceptedFormats?.length && !isFileAllowed(files[0], acceptedFormats)) return

      setSelectedFile(files[0])
      props.onChange?.(files[0])
    }

    const handleFileInput = (e?: React.ChangeEvent<HTMLInputElement>) => {
      if (mode == 'read') {
        return
      }
      validateAndSetFile(e?.target.files)
    }

    const triggerFileInput = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault()
      inputRef.current?.click()
    }

    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault()
    }

    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault()
      if (mode == 'read') {
        return
      }
      validateAndSetFile(event.dataTransfer.files)
    }

    const renderEmptyState = React.useMemo<React.ReactNode>(() => {
      const formatList = acceptedFormats?.map(
        (format, index, arr) =>
          `${index + 1 === arr.length && arr.length > 1 ? 'atau ' : ''}${format.replace('.', '').toUpperCase()}`,
      )

      return (
        <div
          className={cn(
            'border-dashed border border-brand-500 rounded-lg flex flex-col justify-center items-center p-4 gap-y-2 w-[331px] h-[178px]',
            className,
          )}
        >
          <div className="p-2 bg-brand-30 rounded-3xl">
            <Icon name="UploadRoundedOutlined" size={32} className="text-brand-550" />
          </div>
          <div className="flex flex-col items-center justify-center">
            <div className="text-neutral-900 text-sm">{helperText}</div>
            <div className="text-sm mt-1.5 text-neutral-500">
              {formatList && acceptedFormats && `Format ${formatList.join(', ')}.`}
              {maxSize && ` Max ${humanizeSize(maxSize)}`}
            </div>
          </div>
          <div>
            <Button variant="default" onClick={triggerFileInput}>
              <div className="flex flex-row items-center gap-x-1.5">
                <div>
                  <Icon name="UploadOutlined" size={18} className="text-white" />
                </div>
                <div>Browse File</div>
              </div>
            </Button>
          </div>
        </div>
      )
    }, [acceptedFormats, maxSize, className, helperText])

    const renderFilePreview = React.useCallback<(file: File) => React.ReactNode>(
      (file) => {
        const component = (): React.ReactNode => {
          const objectUrl = URL.createObjectURL(file)

          const openInNewWindow = () => {
            window.open(objectUrl)
          }
          // if it's an image
          if (imageExtensions.includes(file.type)) {
            return (
              <Image
                onClick={openInNewWindow}
                src={objectUrl}
                width={331}
                height={166}
                alt={file.name}
                className="rounded-lg max-h-[178px] max-w-[331px] object-contain cursor-pointer"
              />
            )
          }
          // a PDF
          else if (pdfExtension.includes(file.type)) {
            return (
              <div className="cursor-pointer" onClick={openInNewWindow}>
                <PDFViewer
                  pdfFile={objectUrl}
                  width={336}
                  className="w-[336px] h-[178px]"
                />
              </div>
            )
          }

          // other files
          return (
            <div className="w-full h-full flex flex-col justify-center items-center">
              <div className="mt-2">
                <Icon
                  name="DocumentFilled"
                  size={72}
                  className="text-neutral-300 self-center"
                />
              </div>
              <div className="text-sm">{file.name}</div>
              <div className="text-xs text-neutral-300">{humanizeSize(file.size)}</div>
            </div>
          )
        }

        return (
          <div
            className={cn(
              'border border-neutral-150 relative rounded-lg p-0 items-center w-[331px] h-[178px]',
              className,
            )}
          >
            {/* File Thumbnail. */}
            <div className="absolute top-0 left-0 h-full w-full overflow-clip rounded-lg shrink-0">
              {component()}
            </div>
            {/* File actions. (Download, Edit) */}
            <div className="absolute top-2 right-2 z-8 flex flex-row gap-x-2">
              {(mode === 'edit' || mode === 'upload') && (
                <Button
                  variant="secondary"
                  onClick={triggerFileInput}
                  className="w-9 cursor-pointer"
                >
                  <Icon name="EditOutlined" size={18} className="text-brand-550" />
                </Button>
              )}
              {/* TO -DO setup download onClick handler */}
              {mode === 'edit' && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    if (file) {
                      const link = document.createElement('a')
                      link.href = URL.createObjectURL(file)
                      link.download = file.name
                      link.click()
                      URL.revokeObjectURL(link.href)
                    }
                  }}
                  className="w-9 cursor-pointer"
                >
                  <Icon name="DownloadOutlined" className="text-brand-550" size={18} />
                </Button>
              )}
            </div>
          </div>
        )
      },
      [className, mode],
    )

    if (selectedFile === undefined && mode === 'read') {
      return <NoImage />
    }
    return (
      <div onDragOver={handleDragOver} onDrop={handleDrop}>
        {selectedFile ? renderFilePreview(selectedFile) : renderEmptyState}
        <input
          {...props}
          type="file"
          className="hidden"
          multiple={false}
          ref={inputRef}
          onChange={handleFileInput}
          accept={acceptedFormats?.join(',')}
        />
      </div>
    )
  },
)

InputFile.displayName = 'InputFile'
InputFileControl.displayName = 'InputFileControl'

export { InputFile }
