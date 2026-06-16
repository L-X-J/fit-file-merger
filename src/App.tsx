import { useState } from 'react'
import { Toaster, toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, DownloadSimple, Globe, ArrowClockwise, CheckCircle } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
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

    if (currentStep === 1) {
      const allParsedFiles = await Promise.all(
        fileDataArray.map(() => new Promise(resolve => setTimeout(resolve, 100)))
      )
      setTimeout(() => {
        setCurrentStep(2)
      }, 300)
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

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-center" />
      
      {currentStep === 1 && (
        <nav className="fixed top-0 left-0 right-0 bg-card/80 backdrop-blur-xl border-b border-border z-50">
          <div className="container mx-auto px-6 py-4 flex items-center justify-between">
            <h1 className="text-xl font-semibold tracking-tight">{t.title}</h1>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleLanguage}
              className="flex items-center gap-2"
            >
              <Globe size={18} weight="duotone" />
              {lang === 'en' ? '中文' : 'English'}
            </Button>
          </div>
        </nav>
      )}

      <div className={currentStep === 1 ? "pt-20 pb-8" : "py-8"}>
        <div className="container mx-auto px-6 max-w-4xl">
          {currentStep === 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-semibold mb-3 tracking-tight">{t.subtitle}</h2>
              <p className="text-muted-foreground text-sm max-w-2xl mx-auto">
                {t.privacyNote}
              </p>
            </motion.div>
          )}

          {currentStep > 1 && (
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleLanguage}
                  className="flex items-center gap-2"
                >
                  <Globe size={18} weight="duotone" />
                  {lang === 'en' ? '中文' : 'English'}
                </Button>
              </div>
              <div className="flex items-center gap-3">
                {[1, 2, 3].map((step, index) => {
                  const isActive = currentStep === step
                  const isCompleted = currentStep > step
                  
                  return (
                    <div key={step} className="flex items-center">
                      <div
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${
                          isActive
                            ? 'bg-primary w-8'
                            : isCompleted
                            ? 'bg-primary/40'
                            : 'bg-border'
                        }`}
                      />
                      {index < 2 && (
                        <div className={`w-8 h-0.5 transition-colors duration-300 ${isCompleted ? 'bg-primary/30' : 'bg-border'}`} />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {currentStep === 1 && (
                <Step1
                  files={files}
                  onFilesSelected={handleFilesSelected}
                  onRemoveFile={handleRemoveFile}
                  onNext={() => setCurrentStep(2)}
                  canProceed={canProceedToStep2}
                  isMerging={isMerging}
                  lang={currentLang}
                  t={t}
                />
              )}
              
              {currentStep === 2 && (
                <Step2
                  files={files}
                  onRemoveFile={handleRemoveFile}
                  mergeOptions={mergeOptions}
                  onOptionsChange={setMergeOptions}
                  onBack={handleStartOver}
                  onMerge={handleMerge}
                  canProceed={canProceedToStep3}
                  isMerging={isMerging}
                  lang={currentLang}
                  t={t}
                  onFilesSelected={handleFilesSelected}
                />
              )}
              
              {currentStep === 3 && mergedData && (
                <Step3
                  mergedData={mergedData}
                  onDownload={handleDownload}
                  onStartOver={handleStartOver}
                  lang={currentLang}
                  t={t}
                  validFileCount={validFileCount}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

function Step1({ files, onFilesSelected, onRemoveFile, onNext, canProceed, isMerging, lang, t }: any) {
  if (files.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md mx-auto"
      >
        <FileUploadZone 
          onFilesSelected={onFilesSelected} 
          disabled={isMerging}
          lang={lang}
          t={t}
        />
      </motion.div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">
          {t.uploadedFiles} <span className="text-muted-foreground">({files.length})</span>
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => document.getElementById('file-input')?.click()}
          disabled={isMerging}
          className="rounded-full"
        >
          {lang === 'zh' ? '+ 添加文件' : '+ Add Files'}
        </Button>
      </div>

      <div className="space-y-3">
        {files.map((file: FitFileData, index: number) => (
          <motion.div
            key={file.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <FileListItem
              fileData={file}
              onRemove={() => onRemoveFile(file.id)}
              lang={lang}
              t={t}
              showTrack={false}
            />
          </motion.div>
        ))}
      </div>

      {!canProceed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-4 text-sm text-muted-foreground"
        >
          {t.uploadWarning}
        </motion.div>
      )}

      <div className="flex justify-center pt-6">
        <Button
          size="lg"
          onClick={onNext}
          disabled={!canProceed}
          className="px-8 rounded-full shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
        >
          {t.continueToPreview}
          <ArrowRight className="ml-2" size={20} weight="bold" />
        </Button>
      </div>
      
      <input
        id="file-input"
        type="file"
        multiple
        accept=".fit"
        onChange={(e) => {
          const files = Array.from(e.target.files || [])
          if (files.length > 0) {
            onFilesSelected(files)
          }
          e.target.value = ''
        }}
        className="hidden"
      />
    </div>
  )
}

function Step2({ files, onRemoveFile, mergeOptions, onOptionsChange, onBack, onMerge, canProceed, isMerging, lang, t, onFilesSelected }: any) {
  const handleBackToHome = () => {
    onBack()
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold">
            {t.uploadedFiles} <span className="text-muted-foreground">({files.length})</span>
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => document.getElementById('file-input-step2')?.click()}
            disabled={isMerging}
            className="rounded-full"
          >
            {lang === 'zh' ? '+ 添加文件' : '+ Add Files'}
          </Button>
        </div>
        <div className="space-y-3">
          {files.map((file: FitFileData) => (
            <FileListItem
              key={file.id}
              fileData={file}
              onRemove={() => onRemoveFile(file.id)}
              lang={lang}
              t={t}
              showTrack={true}
            />
          ))}
        </div>
      </div>

      <MergeOptionsCard
        options={mergeOptions}
        onOptionsChange={onOptionsChange}
        lang={lang}
        t={t}
      />

      <div className="flex justify-center gap-3 pt-6">
        <Button
          size="lg"
          variant="outline"
          onClick={handleBackToHome}
          className="px-8 rounded-full"
        >
          {t.back}
        </Button>
        <Button
          size="lg"
          onClick={onMerge}
          disabled={isMerging || !canProceed}
          className="px-8 rounded-full shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
        >
          {isMerging ? (
            <>
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="inline-block mr-2"
              >
                ⏳
              </motion.span>
              {t.merging}
            </>
          ) : (
            <>
              {t.continueToMerge}
              <ArrowRight className="ml-2" size={20} weight="bold" />
            </>
          )}
        </Button>
      </div>
      
      <input
        id="file-input-step2"
        type="file"
        multiple
        accept=".fit"
        onChange={(e) => {
          const files = Array.from(e.target.files || [])
          if (files.length > 0) {
            onFilesSelected(files)
          }
          e.target.value = ''
        }}
        className="hidden"
      />
    </div>
  )
}

function Step3({ mergedData, onDownload, onStartOver, lang, t, validFileCount }: any) {
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl p-8 text-center border border-primary/20"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-4"
        >
          <CheckCircle size={32} weight="fill" className="text-primary-foreground" />
        </motion.div>
        <h3 className="text-xl font-semibold mb-2">{t.mergeSuccess}</h3>
        <p className="text-sm text-muted-foreground">
          {validFileCount} {lang === 'zh' ? '个文件已成功合并' : 'files successfully merged'}
        </p>
      </motion.div>

      <TrackMap
        files={mergedData.files}
        onClose={() => {}}
        lang={lang}
        t={t}
        inline={true}
      />

      <div className="flex justify-center gap-3 pt-6">
        <Button
          size="lg"
          variant="outline"
          onClick={onStartOver}
          className="px-8 rounded-full"
        >
          <ArrowClockwise className="mr-2" size={20} />
          {t.startOver}
        </Button>
        <Button
          size="lg"
          onClick={onDownload}
          className="px-8 rounded-full shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
        >
          <DownloadSimple className="mr-2" size={20} weight="bold" />
          {t.download}
        </Button>
      </div>
    </div>
  )
}

export default App
