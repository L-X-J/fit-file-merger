import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { FileUp, FolderOpen } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Translations } from '@/lib/i18n'

interface FileUploadZoneProps {
  onFilesSelected: (files: File[]) => void
  disabled?: boolean
  t: Translations
  variant?: 'hero' | 'compact'
}

export const FileUploadZone = ({
  onFilesSelected,
  disabled,
  t,
  variant = 'compact',
}: FileUploadZoneProps) => {
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isHero = variant === 'hero'

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
    if (!disabled) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragging(false)

    if (disabled) return

    const files = Array.from(event.dataTransfer.files).filter(
      (file) => file.name.endsWith('.fit') || file.name.endsWith('.FIT')
    )

    if (files.length > 0) {
      onFilesSelected(files)
    }
  }

  const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      onFilesSelected(Array.from(event.target.files))
    }
  }

  const openFilePicker = () => {
    if (!disabled) {
      fileInputRef.current?.click()
    }
  }

  return (
    <motion.div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={openFilePicker}
      whileHover={!disabled ? { y: -2 } : undefined}
      whileTap={!disabled ? { scale: 0.995 } : undefined}
      className={cn(
        'group relative overflow-hidden rounded-[1.15rem] border border-dashed transition-all duration-200',
        isHero ? 'h-[16.5rem] px-6 py-6 text-center sm:px-10 sm:py-7' : 'px-6 py-8 text-left sm:px-8 sm:py-10',
        'cursor-pointer border-transparent bg-transparent',
        'hover:border-primary/30 hover:bg-primary/[0.015]',
        isDragging && 'border-primary bg-primary/5 shadow-md',
        disabled && 'cursor-not-allowed opacity-60'
      )}
    >
      <div className={cn('relative flex flex-col gap-2', isHero && 'h-full items-center justify-center')}>
        <div
          className={cn(
            'flex flex-col gap-1.5',
            isHero ? 'items-center' : 'sm:flex-row sm:items-start sm:justify-between'
          )}
        >
          <div className={cn('flex max-w-xl flex-col gap-3', isHero && 'items-center')}>
            <div
              className={cn(
                'inline-flex items-center justify-center rounded-full bg-blue-100 text-primary',
                isHero ? 'size-16' : 'size-12'
              )}
            >
              <FileUp className={isHero ? 'size-8' : 'size-6'} />
            </div>
            <div className={cn('flex flex-col gap-2', isHero && 'items-center')}>
              <h3 className={cn('font-semibold tracking-tight', isHero ? 'text-xl' : 'text-xl')}>
                {t.uploadTitle}
              </h3>
              {!isHero && (
                <p className="text-sm leading-6 text-muted-foreground">
                  {t.uploadDescription}
                </p>
              )}
            </div>
          </div>

          {isHero && <span className="text-sm font-medium text-muted-foreground">or</span>}

          <Button
            type="button"
            size="lg"
            className={cn(isHero && 'h-14 rounded-md px-14 text-base font-semibold shadow-[0_14px_30px_rgba(37,99,235,0.20)]')}
            onClick={(event) => {
              event.stopPropagation()
              openFilePicker()
            }}
            disabled={disabled}
          >
            <FolderOpen data-icon="inline-start" />
            {t.selectFiles}
          </Button>

          {isHero && (
            <p className="mt-1 text-sm font-medium text-muted-foreground">{t.uploadSupport}</p>
          )}
        </div>

        {!isHero && <p className="mt-1 text-sm font-medium text-muted-foreground">{t.uploadSupport}</p>}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".fit,.FIT"
        multiple
        className="hidden"
        onChange={handleFileInput}
      />
    </motion.div>
  )
}
