import { Trash, DotsSixVertical, Clock, CalendarBlank, CheckCircle, Warning } from '@phosphor-icons/react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FitFileData } from '@/lib/types'
import { formatDuration, formatDistance, formatDate } from '@/lib/fitParser'
import { motion } from 'framer-motion'
import type { Language } from '@/lib/i18n'

interface FileListItemProps {
  fileData: FitFileData
  onRemove: () => void
  lang: Language
  t: any
}

export const FileListItem = ({ fileData, onRemove, lang, t }: FileListItemProps) => {
  const getStatusBadge = () => {
    switch (fileData.status) {
      case 'parsing':
        return <Badge variant="secondary">{t.parsing}</Badge>
      case 'parsed':
        return <Badge className="bg-accent text-accent-foreground"><CheckCircle className="mr-1" size={14} />{t.parsed}</Badge>
      case 'error':
        return <Badge variant="destructive"><Warning className="mr-1" size={14} />{t.error}</Badge>
      default:
        return <Badge variant="outline">{t.pending}</Badge>
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="p-4 hover:shadow-md transition-shadow">
        <div className="flex items-start gap-4">
          <div className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors">
            <DotsSixVertical size={24} />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold truncate">{fileData.name}</h4>
                <div className="mt-1">
                  {getStatusBadge()}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onRemove}
                className="hover:bg-destructive hover:text-destructive-foreground"
              >
                <Trash size={18} />
              </Button>
            </div>

            {fileData.status === 'parsed' && fileData.metadata && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                {fileData.metadata.sport && (
                  <div>
                    <p className="text-muted-foreground text-xs">{t.sport}</p>
                    <p className="font-medium capitalize">{fileData.metadata.sport}</p>
                  </div>
                )}
                {fileData.metadata.duration !== undefined && (
                  <div className="flex items-center gap-1">
                    <Clock size={16} className="text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground text-xs">{t.duration}</p>
                      <p className="font-medium">{formatDuration(fileData.metadata.duration)}</p>
                    </div>
                  </div>
                )}
                {fileData.metadata.distance !== undefined && (
                  <div>
                    <p className="text-muted-foreground text-xs">{t.distance}</p>
                    <p className="font-medium">{formatDistance(fileData.metadata.distance)}</p>
                  </div>
                )}
                {fileData.metadata.startTime && (
                  <div className="flex items-center gap-1">
                    <CalendarBlank size={16} className="text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground text-xs">{t.startTime}</p>
                      <p className="font-medium">{formatDate(fileData.metadata.startTime, lang)}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {fileData.status === 'error' && fileData.error && (
              <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
                {fileData.error}
              </div>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
