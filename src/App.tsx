import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { FileUploadZone } from '@/components/FileUploadZone'
import { FileListItem } from '@/components/FileListItem'
import { MergeOptionsCard } from '@/components/MergeOptionsCard'
import { TrackMap } from '@/components/TrackMap'
import { parseFitFile, mergeFitFiles, downloadMergedFile } from '@/lib/fitParser'
import { FitFileData, MergeOptions } from '@/lib/types'
import { useTranslations, Language } from '@/lib/i18n'
import { 
  FilePlus, 
  DownloadSimple, 
  CheckCircle, 
  Warning,
  ArrowLeft,
  ArrowRight,
  CircleNotch,
  Globe
} from '@phosphor-icons/react'

function App() {
  const [files, setFiles] = useState<FitFileData[]>([])
  const [mergeOptions, setMergeOptions] = useState<MergeOptions>({
    sortChronologically: true,
    preserveAllData: true,
    removeDuplicateTimestamps: true,
  })
  const [mergedData, setMergedData] = useState<any>(null)
  const [isMerging, setIsMerging] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [language, setLanguage] = useState<Language>('en')
  const t = useTranslations(language)

  const parsedFiles = files.filter(f => f.status === 'parsed')
  const canMerge = parsedFiles.length >= 2

  const handleFilesSelected = async (newFiles: File[]) => {
    const fileDataArray: FitFileData[] = newFiles.map(file => ({
      id: `${file.name}-${Date.now()}-${Math.random()}`,
      name: file.name,
      file,
      status: 'pending' as const,
    }))

    setFiles(prev => [...prev, ...fileDataArray])

    for (const fileData of fileDataArray) {
      setFiles(prev =>
        prev.map(f => (f.id === fileData.id ? { ...f, status: 'parsing' as const } : f))
      )

      try {
        const result = await parseFitFile(fileData.file)
        
        setFiles(prev =>
          prev.map(f =>
            f.id === fileData.id
              ? {
                  ...f,
                  status: 'parsed' as const,
                  parsed: result.data,
                  metadata: result.metadata,
                }
              : f
          )
        )
        toast.success(`${fileData.name} ${t.parseSuccess}`)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : t.parseFailed
        setFiles(prev =>
          prev.map(f =>
            f.id === fileData.id
              ? {
                  ...f,
                  status: 'error' as const,
                  error: errorMessage,
                }
              : f
          )
        )
        toast.error(`${t.parseFailed}: ${fileData.name}`)
      }
    }
  }

  const handleRemoveFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id))
    if (mergedData) {
      setMergedData(null)
    }
  }

  const handleMerge = async () => {
    if (!canMerge) {
      toast.error(t.needTwoFiles)
      return
    }

    setIsMerging(true)
    try {
      const merged = await mergeFitFiles(parsedFiles, mergeOptions)
      setMergedData(merged)
      toast.success(t.mergeSuccess)
      setCurrentStep(3)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t.mergeError
      toast.error(errorMessage)
    } finally {
      setIsMerging(false)
    }
  }

  const handleDownload = async () => {
    if (!mergedData) return

    setIsDownloading(true)
    try {
      const filename = await downloadMergedFile(mergedData)
      toast.success(`${t.downloadedAs} ${filename}`)
    } catch (error) {
      toast.error(t.mergeError)
    } finally {
      setIsDownloading(false)
    }
  }

  const handleContinueToMerge = () => {
    setCurrentStep(3)
  }

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'zh' : 'en')
  }

  useEffect(() => {
    if (mergedData) {
      setCurrentStep(3)
    } else if (files.length > 0) {
      setCurrentStep(2)
    } else {
      setCurrentStep(1)
    }
  }, [files.length, mergedData])

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex-1" />
            <h1 className="text-4xl font-bold tracking-tight flex-1">{t.title}</h1>
            <div className="flex-1 flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleLanguage}
                className="rounded-full"
              >
                <Globe size={18} className="mr-2" weight="duotone" />
                {language === 'en' ? '中文' : 'English'}
              </Button>
            </div>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t.subtitle}
          </p>
          <Badge variant="secondary" className="mt-4 px-4 py-1.5">
            <CheckCircle size={14} className="mr-1.5" weight="fill" />
            {t.privacyNote}
          </Badge>
        </motion.div>

        <div className="flex items-center justify-center gap-4 mb-10">
          {[1, 2, 3].map(step => (
            <motion.div
              key={step}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: step * 0.1 }}
              className="flex items-center"
            >
              <div
                className={`
                  flex items-center justify-center w-10 h-10 rounded-full font-semibold transition-all duration-300
                  ${currentStep === step ? 'bg-primary text-primary-foreground scale-110 shadow-lg' : ''}
                  ${currentStep > step ? 'bg-primary/20 text-primary' : ''}
                  ${currentStep < step ? 'bg-muted text-muted-foreground' : ''}
                `}
              >
                {currentStep > step ? <CheckCircle size={20} weight="fill" /> : step}
              </div>
              {step < 3 && (
                <div
                  className={`w-16 h-0.5 mx-2 transition-all duration-300 ${
                    currentStep > step ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              )}
            </motion.div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <Card className="p-8 border-2">
                <div className="mb-6">
                  <h2 className="text-2xl font-semibold mb-2">{t.step1Title}</h2>
                  <p className="text-muted-foreground">{t.step1Description}</p>
                </div>
                <FileUploadZone onFilesSelected={handleFilesSelected} lang={language} t={t} />
              </Card>

              {files.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="p-6 border-2">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-semibold">{t.uploadedFiles}</h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => document.querySelector<HTMLInputElement>('input[type="file"]')?.click()}
                        className="rounded-full"
                      >
                        <FilePlus size={16} className="mr-2" weight="duotone" />
                        {t.addMore}
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {files.map(fileData => (
                        <FileListItem
                          key={fileData.id}
                          fileData={fileData}
                          onRemove={() => handleRemoveFile(fileData.id)}
                          lang={language}
                          t={t}
                        />
                      ))}
                    </div>
                    {!canMerge && (
                      <Alert className="mt-6 border-primary/30 bg-primary/5">
                        <Warning className="h-4 w-4 text-primary" weight="duotone" />
                        <AlertDescription className="text-sm">
                          {t.uploadWarning}
                        </AlertDescription>
                      </Alert>
                    )}
                    {canMerge && (
                      <Button
                        size="lg"
                        className="w-full mt-6 rounded-full"
                        onClick={() => setCurrentStep(2)}
                      >
                        {t.continueToPreview}
                        <ArrowRight size={18} className="ml-2" weight="bold" />
                      </Button>
                    )}
                  </Card>
                </motion.div>
              )}
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <Card className="p-8 border-2">
                <div className="mb-6">
                  <h2 className="text-2xl font-semibold mb-2">{t.step2Title}</h2>
                  <p className="text-muted-foreground">{t.step2Description}</p>
                </div>

                <div className="space-y-4 mb-6">
                  {parsedFiles.map(fileData => (
                    <FileListItem
                      key={fileData.id}
                      fileData={fileData}
                      onRemove={() => handleRemoveFile(fileData.id)}
                      lang={language}
                      t={t}
                      showTrack={true}
                    />
                  ))}
                </div>

                <MergeOptionsCard
                  options={mergeOptions}
                  onOptionsChange={setMergeOptions}
                  lang={language}
                  t={t}
                />

                <div className="flex gap-3 mt-6">
                  <Button
                    variant="outline"
                    size="lg"
                    className="flex-1 rounded-full"
                    onClick={() => setCurrentStep(1)}
                  >
                    <ArrowLeft size={18} className="mr-2" weight="bold" />
                    {t.back}
                  </Button>
                  <Button
                    size="lg"
                    className="flex-1 rounded-full"
                    onClick={handleContinueToMerge}
                    disabled={!canMerge}
                  >
                    {t.continueToMerge}
                    <ArrowRight size={18} className="ml-2" weight="bold" />
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}

          {currentStep === 3 && (
            <motion.div
              key="step-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <Card className="p-8 border-2">
                <div className="mb-6">
                  <h2 className="text-2xl font-semibold mb-2">{t.step3Title}</h2>
                  <p className="text-muted-foreground">{t.step3Description}</p>
                </div>

                <TrackMap files={parsedFiles} lang={language} t={t} inline={true} />

                <div className="flex gap-3 mt-6">
                  <Button
                    variant="outline"
                    size="lg"
                    className="flex-1 rounded-full"
                    onClick={() => {
                      setCurrentStep(2)
                    }}
                  >
                    <ArrowLeft size={18} className="mr-2" weight="bold" />
                    {t.back}
                  </Button>
                  <Button
                    size="lg"
                    className="flex-1 rounded-full bg-primary hover:bg-primary/90"
                    onClick={async () => {
                      if (mergedData) {
                        await handleDownload()
                      } else {
                        setIsMerging(true)
                        try {
                          const merged = await mergeFitFiles(parsedFiles, mergeOptions)
                          setMergedData(merged)
                          await handleDownload()
                        } catch (error) {
                          const errorMessage = error instanceof Error ? error.message : t.mergeError
                          toast.error(errorMessage)
                        } finally {
                          setIsMerging(false)
                        }
                      }
                    }}
                    disabled={isMerging || isDownloading}
                  >
                    {isMerging || isDownloading ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        >
                          <CircleNotch size={18} className="mr-2" />
                        </motion.div>
                        {isMerging ? t.merging : t.downloading}
                      </>
                    ) : (
                      <>
                        <DownloadSimple size={18} className="mr-2" weight="bold" />
                        {t.download}
                      </>
                    )}
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  className="w-full mt-3 rounded-full"
                  onClick={() => {
                    setFiles([])
                    setMergedData(null)
                    setCurrentStep(1)
                  }}
                >
                  {t.startOver}
                </Button>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default App
