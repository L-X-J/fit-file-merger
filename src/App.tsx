import { useState } from 'react'
import { Toaster, toast } from 'sonner'
import { DownloadSimple, FilePlus } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { FileUploadZone } from '@/components/FileUploadZone'
import { FileListItem } from '@/components/FileListItem'
import { MergeOptionsCard } from '@/components/MergeOptionsCard'
import { FitFileData, MergeOptions } from '@/lib/types'
import { parseFitFile } from '@/lib/fitParser'
import { mergeFitFiles, downloadFitFile } from '@/lib/fitMerger'

function App() {
  const [files, setFiles] = useState<FitFileData[]>([])
  const [mergeOptions, setMergeOptions] = useState<MergeOptions>({
    sortChronologically: true,
    preserveAllData: true,
    removeDuplicateTimestamps: false,
  })
  const [isMerging, setIsMerging] = useState(false)

  const handleFilesSelected = async (newFiles: File[]) => {
    const fileDataArray: FitFileData[] = newFiles.map((file) => ({
      id: `${Date.now()}-${Math.random()}`,
      name: file.name,
      file,
      status: 'pending' as const,
    }))

    setFiles((prev) => [...prev, ...fileDataArray])

    for (const fileData of fileDataArray) {
      setFiles((prev) =>
        prev.map((f) => (f.id === fileData.id ? { ...f, status: 'parsing' as const } : f))
      )

      const parsed = await parseFitFile(fileData)
      
      setFiles((prev) =>
        prev.map((f) => (f.id === fileData.id ? parsed : f))
      )

      if (parsed.status === 'error') {
        toast.error(`Failed to parse ${parsed.name}`, {
          description: parsed.error,
        })
      } else {
        toast.success(`${parsed.name} parsed successfully`)
      }
    }
  }

  const handleRemoveFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id))
  }

  const handleMerge = async () => {
    const validFiles = files.filter((f) => f.status === 'parsed')

    if (validFiles.length < 2) {
      toast.error('Need at least 2 valid files to merge')
      return
    }

    setIsMerging(true)
    try {
      const mergedBlob = mergeFitFiles(validFiles, mergeOptions)
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
      const filename = `merged-fit-${timestamp}.fit`
      downloadFitFile(mergedBlob, filename)
      toast.success('Files merged successfully!', {
        description: `Downloaded as ${filename}`,
      })
    } catch (error) {
      toast.error('Failed to merge files', {
        description: error instanceof Error ? error.message : 'Unknown error occurred',
      })
    } finally {
      setIsMerging(false)
    }
  }

  const validFileCount = files.filter((f) => f.status === 'parsed').length
  const canMerge = validFileCount >= 2

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Toaster />
      <div className="container mx-auto px-6 py-8 max-w-5xl">
        <header className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-2">FIT File Merger</h1>
          <p className="text-muted-foreground text-lg">
            Merge multiple fitness activity files from Garmin, Polar, and Suunto devices
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            All processing happens in your browser - your files never leave your device
          </p>
        </header>

        <div className="space-y-8">
          <FileUploadZone onFilesSelected={handleFilesSelected} disabled={isMerging} />

          {files.length > 0 && (
            <>
              <Separator />
              
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">
                    Uploaded Files ({files.length})
                  </h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => document.querySelector('input[type="file"]')?.dispatchEvent(new MouseEvent('click'))}
                    disabled={isMerging}
                  >
                    <FilePlus className="mr-2" />
                    Add More
                  </Button>
                </div>

                {files.length > 0 && validFileCount < 2 && (
                  <Alert className="mb-4">
                    <AlertDescription>
                      Upload at least 2 valid FIT files to enable merging
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-3">
                  {files.map((file) => (
                    <FileListItem
                      key={file.id}
                      fileData={file}
                      onRemove={() => handleRemoveFile(file.id)}
                    />
                  ))}
                </div>
              </div>

              {canMerge && (
                <>
                  <Separator />
                  
                  <MergeOptionsCard
                    options={mergeOptions}
                    onOptionsChange={setMergeOptions}
                  />

                  <div className="flex justify-center">
                    <Button
                      size="lg"
                      onClick={handleMerge}
                      disabled={isMerging}
                      className="px-8"
                    >
                      {isMerging ? (
                        <>
                          <span className="animate-spin mr-2">⏳</span>
                          Merging...
                        </>
                      ) : (
                        <>
                          <DownloadSimple className="mr-2" size={20} />
                          Merge & Download
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default App