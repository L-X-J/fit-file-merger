import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { UploadSimple, ArrowRight } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Language } from '@/lib/i18n'

interface FileUploadZoneProps {
  onFilesSelected: (files: File[]) => void
  disabled?: boolean
  lang: Language
  t: any
}

export const FileUploadZone = ({ onFilesSelected, disabled, lang, t }: FileUploadZoneProps) => {
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    if (disabled) return

    const files = Array.from(e.dataTransfer.files).filter(
      file => file.name.endsWith('.fit') || file.name.endsWith('.FIT')
    )

    if (files.length > 0) {
      onFilesSelected(files)
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      onFilesSelected(files)
    }
  }

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click()
    }
  }

  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!disabled) {
      fileInputRef.current?.click()
    }
  }

  return (
    <motion.div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      whileHover={!disabled ? { scale: 1.01 } : undefined}
      whileTap={!disabled ? { scale: 0.99 } : undefined}
      className={cn(
        'relative border-2 border-dashed rounded-2xl p-16 text-center cursor-pointer transition-all duration-300',
        'hover:border-primary/50 hover:bg-primary/5',
        isDragging && 'border-primary bg-primary/10 scale-[1.01]',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <div className="flex flex-col items-center gap-5">
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/10 rounded-3xl"
        >
          <ArrowRight size={40} weight="bold" className="text-primary" />
        </motion.div>
        <div className="space-y-2">
          <h3 className="text-2xl font-semibold">{lang === 'zh' ? '开始合并' : 'Get Started'}</h3>
          <p className="text-sm text-muted-foreground">
            {lang === 'zh' ? '选择至少两个 FIT 文件开始合并' : 'Select at least two FIT files to begin'}
          </p>
        </div>
        <Button 
          variant="outline" 
          size="lg"
          disabled={disabled} 
          onClick={handleButtonClick}
          className="rounded-full mt-2"
        >
          <UploadSimple className="mr-2" weight="bold" />
          {t.selectFiles}
        </Button>
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
