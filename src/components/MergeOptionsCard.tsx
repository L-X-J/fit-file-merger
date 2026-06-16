import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { MergeOptions } from '@/lib/types'

interface MergeOptionsCardProps {
  options: MergeOptions
  onOptionsChange: (options: MergeOptions) => void
}

export const MergeOptionsCard = ({ options, onOptionsChange }: MergeOptionsCardProps) => {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Merge Options</h3>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="sort-chronologically">Sort Chronologically</Label>
            <p className="text-sm text-muted-foreground">
              Reorder all data points by timestamp
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
            <Label htmlFor="preserve-all-data">Preserve All Data</Label>
            <p className="text-sm text-muted-foreground">
              Keep all data fields from source files
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
            <Label htmlFor="remove-duplicates">Remove Duplicate Timestamps</Label>
            <p className="text-sm text-muted-foreground">
              Filter out records with identical timestamps
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
