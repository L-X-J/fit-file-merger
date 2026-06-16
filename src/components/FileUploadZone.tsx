import { useRef, useState } from 'react'
import { UploadSimple } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface FileUploadZoneProps {
  onFilesSelected: (files: File[]) => void
  disabled?: boolean
}

export const FileUploadZone = ({ onFilesSelected, disabled }: FileUploadZoneProps) => {
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

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      className={cn(
        'border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all duration-200',
        'hover:border-accent hover:bg-accent/5',
        isDragging && 'drag-over',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <UploadSimple size={32} className="text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-1">Upload FIT Files</h3>
          <p className="text-sm text-muted-foreground">
            Drag and drop files here, or click to browse
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Supports .fit files from Garmin, Polar, Suunto devices
          </p>
        </div>
        <Button variant="outline" disabled={disabled} onClick={(e) => e.stopPropagation()}>
          <UploadSimple className="mr-2" />
          Select Files
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
    </div>
  )
}
