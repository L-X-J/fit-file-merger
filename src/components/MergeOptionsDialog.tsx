import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Gear } from '@phosphor-icons/react'
import { MergeOptions } from '@/lib/types'
import type { Language } from '@/lib/i18n'

interface MergeOptionsDialogProps {
  options: MergeOptions
  onOptionsChange: (options: MergeOptions) => void
  lang: Language
  t: any
}

export const MergeOptionsDialog = ({ options, onOptionsChange, lang, t }: MergeOptionsDialogProps) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="rounded-full text-muted-foreground hover:text-foreground"
          aria-label={t.mergeOptions}
        >
          <Gear size={18} weight="duotone" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Gear size={18} className="text-primary" weight="duotone" />
            </div>
            {t.mergeOptions}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 pt-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1 flex-1">
              <Label htmlFor="sort-chronologically" className="text-base font-medium cursor-pointer">
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
              <Label htmlFor="preserve-all-data" className="text-base font-medium cursor-pointer">
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
              <Label htmlFor="remove-duplicates" className="text-base font-medium cursor-pointer">
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
      </DialogContent>
    </Dialog>
  )
}
