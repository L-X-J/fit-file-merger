import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Gear } from '@phosphor-icons/react'
import { MergeOptions } from '@/lib/types'
import type { Language } from '@/lib/i18n'

interface MergeOptionsCardProps {
  options: MergeOptions
  onOptionsChange: (options: MergeOptions) => void
  lang: Language
  t: any
}

export const MergeOptionsCard = ({ options, onOptionsChange, lang, t }: MergeOptionsCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="p-6 border-2">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Gear size={20} className="text-primary" weight="duotone" />
          </div>
          <h3 className="text-lg font-semibold">{t.mergeOptions}</h3>
        </div>
        
        <div className="space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1 flex-1">
              <Label htmlFor="sort-chronologically" className="text-base font-medium">
                {t.sortChronologically}
              </Label>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t.sortDescription}
              </p>
            </div>
            <Switch
              id="sort-chronologically"
              checked={options.sortChronologically}
              onCheckedChange={(checked) =>
                onOptionsChange({ ...options, sortChronologically: checked })
              }
            />
          </div>

          <div className="h-px bg-border" />

          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1 flex-1">
              <Label htmlFor="preserve-all-data" className="text-base font-medium">
                {t.preserveAllData}
              </Label>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t.preserveDescription}
              </p>
            </div>
            <Switch
              id="preserve-all-data"
              checked={options.preserveAllData}
              onCheckedChange={(checked) =>
                onOptionsChange({ ...options, preserveAllData: checked })
              }
            />
          </div>

          <div className="h-px bg-border" />

          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1 flex-1">
              <Label htmlFor="remove-duplicates" className="text-base font-medium">
                {t.removeDuplicates}
              </Label>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t.removeDuplicatesDescription}
              </p>
            </div>
            <Switch
              id="remove-duplicates"
              checked={options.removeDuplicateTimestamps}
              onCheckedChange={(checked) =>
                onOptionsChange({ ...options, removeDuplicateTimestamps: checked })
              }
            />
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
