import { useState } from 'react'
import { Toaster, toast } from 'sonner'
import { DownloadSimple, FilePlus, MapTrifold, Globe } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { FileUploadZone } from '@/components/FileUploadZone'
import { FileListItem } from '@/components/FileListItem'
import { MergeOptionsCard } from '@/components/MergeOptionsCard'
import { TrackMap } from '@/components/TrackMap'
import { FitFileData, MergeOptions } from '@/lib/types'
import { parseFitFile } from '@/lib/fitParser'
import { mergeFitFiles, downloadFitFile } from '@/lib/fitMerger'
import { Language, useTranslations } from '@/lib/i18n'
import { useKV } from '@github/spark/hooks'

function App() {
  const [lang, setLang] = useKV<Language>('app-language', 'en')
  const currentLang: Language = lang || 'en'
  const t = useTranslations(currentLang)
  
  const [files, setFiles] = useState<FitFileData[]>([])
  const [mergeOptions, setMergeOptions] = useState<MergeOptions>({
    sortChronologically: true,
    preserveAllData: true,
    removeDuplicateTimestamps: false,
  })
  const [isMerging, setIsMerging] = useState(false)
  const [mergedData, setMergedData] = useState<{ files: FitFileData[]; blob: Blob } | null>(null)
  const [showMap, setShowMap] = useState(false)

  const toggleLanguage = () => {
    setLang(currentLang === 'en' ? 'zh' : 'en')
  }

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
        toast.error(`${t.parseFailed} ${parsed.name}`, {
          description: parsed.error,
        })
      } else {
        toast.success(`${parsed.name} ${t.parseSuccess}`)
      }
    }
  }

  const handleRemoveFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id))
    if (mergedData) {
      setMergedData(null)
    }
  }

  const handleMerge = async () => {
    const validFiles = files.filter((f) => f.status === 'parsed')

    if (validFiles.length < 2) {
      toast.error(t.needTwoFiles)
      return
    }

    setIsMerging(true)
    try {
      const mergedBlob = mergeFitFiles(validFiles, mergeOptions)
      setMergedData({ files: validFiles, blob: mergedBlob })
      toast.success(t.mergeSuccess)
    } catch (error) {
      toast.error(t.mergeError, {
        description: error instanceof Error ? error.message : 'Unknown error occurred',
      })
    } finally {
      setIsMerging(false)
    }
  }

  const handleDownload = () => {
    if (!mergedData) return
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
    const filename = `merged-fit-${timestamp}.fit`
    downloadFitFile(mergedData.blob, filename)
    toast.success(`${t.downloadedAs} ${filename}`)
  }

  const handleShowMap = () => {
    const validFiles = files.filter((f) => f.status === 'parsed')
    if (validFiles.length > 0) {
      setShowMap(true)
    }
  }

  const validFileCount = files.filter((f) => f.status === 'parsed').length
  const canMerge = validFileCount >= 2

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Toaster />
      <div className="container mx-auto px-6 py-8 max-w-5xl">
        <header className="mb-8">
          <div className="flex items-start justify-between gap-4 mb-2">
            <h1 className="text-4xl font-bold tracking-tight">{t.title}</h1>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleLanguage}
              className="flex items-center gap-2"
            >
              <Globe size={18} />
              {lang === 'en' ? '中文' : 'English'}
            </Button>
          </div>
          <p className="text-muted-foreground text-lg">
            {t.subtitle}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            {t.privacyNote}
          </p>
        </header>

        <div className="space-y-8">
          <FileUploadZone 
            onFilesSelected={handleFilesSelected} 
            disabled={isMerging}
            lang={currentLang}
            t={t}
          />

          {files.length > 0 && (
            <>
              <Separator />
              
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">
                    {t.uploadedFiles} ({files.length})
                  </h2>
                  <div className="flex gap-2">
                    {validFileCount > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleShowMap}
                      >
                        <MapTrifold className="mr-2" />
                        {t.mapView}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => document.querySelector('input[type="file"]')?.dispatchEvent(new MouseEvent('click'))}
                      disabled={isMerging}
                    >
                      <FilePlus className="mr-2" />
                      {t.addMore}
                    </Button>
                  </div>
                </div>

                {files.length > 0 && validFileCount < 2 && (
                  <Alert className="mb-4">
                    <AlertDescription>
                      {t.uploadWarning}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-3">
                  {files.map((file) => (
                    <FileListItem
                      key={file.id}
                      fileData={file}
                      onRemove={() => handleRemoveFile(file.id)}
                      lang={currentLang}
                      t={t}
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
                    lang={currentLang}
                    t={t}
                  />

                  <div className="flex justify-center gap-4">
                    {!mergedData ? (
                      <Button
                        size="lg"
                        onClick={handleMerge}
                        disabled={isMerging}
                        className="px-8"
                      >
                        {isMerging ? (
                          <>
                            <span className="animate-spin mr-2">⏳</span>
                            {t.merging}
                          </>
                        ) : (
                          <>
                            <DownloadSimple className="mr-2" size={20} />
                            {t.merge}
                          </>
                        )}
                      </Button>
                    ) : (
                      <>
                        <Button
                          size="lg"
                          onClick={handleDownload}
                          className="px-8"
                        >
                          <DownloadSimple className="mr-2" size={20} />
                          {t.download}
                        </Button>
                        <Button
                          size="lg"
                          variant="outline"
                          onClick={() => setMergedData(null)}
                          className="px-8"
                        >
                          {t.merge} {lang === 'zh' ? '其他' : 'Again'}
                        </Button>
                      </>
                    )}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {showMap && validFileCount > 0 && (
        <TrackMap
          files={files.filter((f) => f.status === 'parsed')}
          onClose={() => setShowMap(false)}
          lang={currentLang}
          t={t}
        />
      )}
    </div>
  )
}

export default App
