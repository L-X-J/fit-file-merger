import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
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
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">{t.mergeOptions}</h3>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="sort-chronologically">{t.sortChronologically}</Label>
            <p className="text-sm text-muted-foreground">
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

        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="preserve-all-data">{t.preserveAllData}</Label>
            <p className="text-sm text-muted-foreground">
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

        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="remove-duplicates">{t.removeDuplicates}</Label>
            <p className="text-sm text-muted-foreground">
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
  )
}
