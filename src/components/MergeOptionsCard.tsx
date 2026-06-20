import { ListOrdered, Settings2, ShieldCheck, TimerReset } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import type { Translations } from '@/lib/i18n'
import type { MergeOptions } from '@/lib/types'

interface MergeOptionsCardProps {
  options: MergeOptions
  onOptionsChange: (options: MergeOptions) => void
  t: Translations
}

const optionMetadata = {
  sortChronologically: {
    icon: <ListOrdered className="size-4 text-primary" />,
  },
  preserveAllData: {
    icon: <ShieldCheck className="size-4 text-primary" />,
  },
  removeDuplicateTimestamps: {
    icon: <TimerReset className="size-4 text-primary" />,
  },
}

export const MergeOptionsCard = ({ options, onOptionsChange, t }: MergeOptionsCardProps) => {
  return (
    <Card className="panel-surface overflow-hidden">
      <CardHeader className="border-b border-border/70">
        <div className="flex items-center gap-3">
          <div className="inline-flex size-11 items-center justify-center rounded-2xl border border-primary/15 bg-primary/10 text-primary">
            <Settings2 />
          </div>
          <div className="flex flex-col gap-1">
            <CardTitle>{t.mergeOptions}</CardTitle>
            <CardDescription>{t.mergeOptionsHint}</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-5 pt-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-3">
            <div className="mt-0.5 inline-flex size-9 items-center justify-center rounded-xl bg-primary/10">
              {optionMetadata.sortChronologically.icon}
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="sort-chronologically" className="text-sm font-medium">
                {t.sortChronologically}
              </label>
              <p className="text-sm leading-6 text-muted-foreground">{t.sortDescription}</p>
            </div>
          </div>
          <Switch
            id="sort-chronologically"
            checked={options.sortChronologically}
            onCheckedChange={(checked) => onOptionsChange({ ...options, sortChronologically: checked })}
          />
        </div>

        <Separator />

        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-3">
            <div className="mt-0.5 inline-flex size-9 items-center justify-center rounded-xl bg-primary/10">
              {optionMetadata.preserveAllData.icon}
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="preserve-all-data" className="text-sm font-medium">
                {t.preserveAllData}
              </label>
              <p className="text-sm leading-6 text-muted-foreground">{t.preserveDescription}</p>
            </div>
          </div>
          <Switch
            id="preserve-all-data"
            checked={options.preserveAllData}
            onCheckedChange={(checked) => onOptionsChange({ ...options, preserveAllData: checked })}
          />
        </div>

        <Separator />

        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-3">
            <div className="mt-0.5 inline-flex size-9 items-center justify-center rounded-xl bg-primary/10">
              {optionMetadata.removeDuplicateTimestamps.icon}
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="remove-duplicates" className="text-sm font-medium">
                {t.removeDuplicates}
              </label>
              <p className="text-sm leading-6 text-muted-foreground">{t.removeDuplicatesDescription}</p>
            </div>
          </div>
          <Switch
            id="remove-duplicates"
            checked={options.removeDuplicateTimestamps}
            onCheckedChange={(checked) =>
              onOptionsChange({ ...options, removeDuplicateTimestamps: checked })
            }
          />
        </div>
      </CardContent>
    </Card>
  )
}
