import { useState } from 'react'
import { Toaster, toast } from 'sonner'
import { ArrowRight, ArrowLeft, DownloadSimple, FilePlus, Globe, ArrowClockwise } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { FileUploadZone } from '@/components/FileUploadZone'
import { FileListItem } from '@/components/FileListItem'
import { MergeOptionsCard } from '@/components/MergeOptionsCard'
import { TrackMap } from '@/components/TrackMap'
import { FitFileData, MergeOptions } from '@/lib/types'
import { parseFitFile } from '@/lib/fitParser'
import { mergeFitFiles, downloadFitFile } from '@/lib/fitMerger'
import { Language, useTranslations } from '@/lib/i18n'
import { useKV } from '@github/spark/hooks'

type Step = 1 | 2 | 3

function App() {
  const [lang, setLang] = useKV<Language>('app-language', 'en')
  const currentLang: Language = lang || 'en'
  const t = useTranslations(currentLang)
  
  const [currentStep, setCurrentStep] = useState<Step>(1)
  const [files, setFiles] = useState<FitFileData[]>([])
  const [mergeOptions, setMergeOptions] = useState<MergeOptions>({
    sortChronologically: true,
    preserveAllData: true,
    removeDuplicateTimestamps: false,
  })
  const [isMerging, setIsMerging] = useState(false)
  const [mergedData, setMergedData] = useState<{ files: FitFileData[]; blob: Blob } | null>(null)

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
      const mergedBlob = await mergeFitFiles(validFiles, mergeOptions)
      setMergedData({ files: validFiles, blob: mergedBlob })
      toast.success(t.mergeSuccess)
      setCurrentStep(3)
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

  const handleStartOver = () => {
    setFiles([])
    setMergedData(null)
    setCurrentStep(1)
  }

  const validFileCount = files.filter((f) => f.status === 'parsed').length
  const canProceedToStep2 = validFileCount >= 2
  const canProceedToStep3 = canProceedToStep2

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-8">
      {[1, 2, 3].map((step) => {
        const isActive = currentStep === step
        const isCompleted = currentStep > step
        
        return (
          <div key={step} className="flex items-center">
            <div className="flex flex-col items-center gap-2">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                  isActive
                    ? 'bg-primary text-primary-foreground scale-110'
                    : isCompleted
                    ? 'bg-accent text-accent-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {step}
              </div>
              <div className="text-center">
                <p className={`text-xs font-medium ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {step === 1 && t.step1Title}
                  {step === 2 && t.step2Title}
                  {step === 3 && t.step3Title}
                </p>
              </div>
            </div>
            {step < 3 && (
              <div className={`w-12 h-0.5 mx-2 mb-6 ${isCompleted ? 'bg-accent' : 'bg-muted'}`} />
            )}
          </div>
        )
      })}
    </div>
  )

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">{t.step1Title}</h2>
        <p className="text-muted-foreground">{t.step1Description}</p>
      </div>

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
              <h3 className="text-lg font-semibold">
                {t.uploadedFiles} ({files.length})
              </h3>
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
                  showTrack={false}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-center pt-4">
            <Button
              size="lg"
              onClick={() => setCurrentStep(2)}
              disabled={!canProceedToStep2}
              className="px-8"
            >
              {t.continueToPreview}
              <ArrowRight className="ml-2" size={20} />
            </Button>
          </div>
        </>
      )}
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">{t.step2Title}</h2>
        <p className="text-muted-foreground">{t.step2Description}</p>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">
          {t.uploadedFiles} ({files.length})
        </h3>
        <div className="space-y-3">
          {files.map((file) => (
            <FileListItem
              key={file.id}
              fileData={file}
              onRemove={() => handleRemoveFile(file.id)}
              lang={currentLang}
              t={t}
              showTrack={true}
            />
          ))}
        </div>
      </div>

      <Separator />

      <MergeOptionsCard
        options={mergeOptions}
        onOptionsChange={setMergeOptions}
        lang={currentLang}
        t={t}
      />

      <div className="flex justify-center gap-4 pt-4">
        <Button
          size="lg"
          variant="outline"
          onClick={() => setCurrentStep(1)}
          className="px-8"
        >
          <ArrowLeft className="mr-2" size={20} />
          {t.back}
        </Button>
        <Button
          size="lg"
          onClick={handleMerge}
          disabled={isMerging || !canProceedToStep3}
          className="px-8"
        >
          {isMerging ? (
            <>
              <span className="animate-spin mr-2">⏳</span>
              {t.merging}
            </>
          ) : (
            <>
              {t.continueToMerge}
              <ArrowRight className="ml-2" size={20} />
            </>
          )}
        </Button>
      </div>
    </div>
  )

  const renderStep3 = () => {
    if (!mergedData) return null

    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-2">{t.step3Title}</h2>
          <p className="text-muted-foreground">{t.step3Description}</p>
        </div>

        <div className="bg-accent/10 border-2 border-accent rounded-lg p-6 text-center">
          <Badge className="mb-4 bg-accent text-accent-foreground text-base px-4 py-2">
            {t.mergeSuccess}
          </Badge>
          <p className="text-sm text-muted-foreground">
            {validFileCount} {lang === 'zh' ? '个文件已成功合并' : 'files successfully merged'}
          </p>
        </div>

        <TrackMap
          files={mergedData.files}
          onClose={() => {}}
          lang={currentLang}
          t={t}
          inline={true}
        />

        <div className="flex justify-center gap-4 pt-4">
          <Button
            size="lg"
            variant="outline"
            onClick={handleStartOver}
            className="px-8"
          >
            <ArrowClockwise className="mr-2" size={20} />
            {t.startOver}
          </Button>
          <Button
            size="lg"
            onClick={handleDownload}
            className="px-8"
          >
            <DownloadSimple className="mr-2" size={20} />
            {t.download}
          </Button>
        </div>
      </div>
    )
  }

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

        {renderStepIndicator()}

        <div className="mt-8">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
        </div>
      </div>
    </div>
  )
}

export default App
