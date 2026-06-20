import { Settings2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import type { MergeOptions } from '@/lib/types'
import type { Translations } from '@/lib/i18n'

interface MergeOptionsDialogProps {
  options: MergeOptions
  onOptionsChange: (options: MergeOptions) => void
  t: Translations
  disabled?: boolean
}

export const MergeOptionsDialog = ({
  options,
  onOptionsChange,
  t,
  disabled = false,
}: MergeOptionsDialogProps) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="h-11 rounded-lg bg-white/90 px-5 font-semibold shadow-sm"
          aria-label={t.mergeOptions}
          disabled={disabled}
        >
          <Settings2 />
          {t.mergeOptions}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[34rem]">
        <DialogHeader>
          <DialogTitle>{t.mergeOptions}</DialogTitle>
          <DialogDescription>{t.mergeOptionsHint}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5 pt-2">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <label htmlFor="dialog-sort-chronologically" className="text-sm font-medium">
                {t.sortChronologically}
              </label>
              <p className="text-sm leading-6 text-muted-foreground">{t.sortDescription}</p>
            </div>
            <Switch
              id="dialog-sort-chronologically"
              checked={options.sortChronologically}
              disabled={disabled}
              onCheckedChange={(checked) => onOptionsChange({ ...options, sortChronologically: checked })}
            />
          </div>

          <Separator />

          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <label htmlFor="dialog-preserve-all-data" className="text-sm font-medium">
                {t.preserveAllData}
              </label>
              <p className="text-sm leading-6 text-muted-foreground">{t.preserveDescription}</p>
            </div>
            <Switch
              id="dialog-preserve-all-data"
              checked={options.preserveAllData}
              disabled={disabled}
              onCheckedChange={(checked) => onOptionsChange({ ...options, preserveAllData: checked })}
            />
          </div>

          <Separator />

          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <label htmlFor="dialog-remove-duplicates" className="text-sm font-medium">
                {t.removeDuplicates}
              </label>
              <p className="text-sm leading-6 text-muted-foreground">{t.removeDuplicatesDescription}</p>
            </div>
            <Switch
              id="dialog-remove-duplicates"
              checked={options.removeDuplicateTimestamps}
              disabled={disabled}
              onCheckedChange={(checked) =>
                onOptionsChange({ ...options, removeDuplicateTimestamps: checked })
              }
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
