import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  Bike,
  Calendar,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Download,
  FilePlus2,
  Footprints,
  Layers3,
  LockKeyhole,
  Languages,
  MapPinned,
  Route,
  Shield,
} from 'lucide-react'

import { FileListItem } from '@/components/FileListItem'
import { FileUploadZone } from '@/components/FileUploadZone'
import { LottieAnimation } from '@/components/LottieAnimation'
import { MergeOptionsDialog } from '@/components/MergeOptionsDialog'
import { TrackMap } from '@/components/TrackMap'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Toaster } from '@/components/ui/sonner'
import {
  downloadMergedFile,
  formatDistance,
  parseFitFile,
} from '@/lib/fitParser'
import { calculateFileMd5 } from '@/lib/fileHash'
import { useTranslations, type Language } from '@/lib/i18n'
import { mergeFitFilesInWorker } from '@/lib/mergeInWorker'
import type { FitFileData, MergeOptions } from '@/lib/types'
import cyclingAnimation from '@/assets/cycling.json'

type FlowStep = 1 | 2 | 3

const demoActivities = [
  {
    name: 'Morning Run.fit',
    device: 'Garmin Forerunner 955',
    sport: 'Run',
    duration: 45 * 60 + 12,
    distance: 8.24,
    startTime: new Date('2024-05-18T07:15:00'),
    totalAscent: 164,
    source: '/sample_data/Ride_on_10_6_2026_.fit',
  },
  {
    name: 'Weekend Ride.fit',
    device: 'Garmin Edge 840',
    sport: 'Ride',
    duration: 1 * 3600 + 56 * 60 + 43,
    distance: 56.73,
    startTime: new Date('2024-05-18T09:02:00'),
    totalAscent: 812,
    source: '/sample_data/Ride_on_14_6_2026.fit',
  },
  {
    name: 'Trail Run.fit',
    device: 'Polar Vantage V2',
    sport: 'Run',
    duration: 1 * 3600 + 2 * 60 + 18,
    distance: 11.08,
    startTime: new Date('2024-05-19T06:47:00'),
    totalAscent: 265,
    source: '/sample_data/Ride_on_10_6_2026_.fit',
  },
  {
    name: 'Evening Ride.fit',
    device: 'Suunto 9 Peak',
    sport: 'Ride',
    duration: 2 * 3600 + 31 * 60 + 9,
    distance: 72.41,
    startTime: new Date('2024-05-19T17:03:00'),
    totalAscent: 545,
    source: '/sample_data/Ride_on_14_6_2026.fit',
  },
]

const formatClockDuration = (seconds?: number) => {
  if (!seconds) return 'N/A'
  const totalSeconds = Math.floor(seconds)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const secs = totalSeconds % 60

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  return `${minutes}:${String(secs).padStart(2, '0')}`
}

const formatActivityDate = (date?: Date) => {
  if (!date) return { date: 'N/A', time: '' }
  return {
    date: new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date),
    time: new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    }).format(date),
  }
}

const LogoMark = () => (
  <svg
    aria-hidden="true"
    className="h-10 w-10 text-primary"
    viewBox="0 0 44 44"
    fill="none"
  >
    <path
      d="M5 31.5 17.3 9.8l6.2 10.7 4.4-7.7L39 31.5h-6.4l-4.7-8.2-4.4 7.8-6.2-10.6-6.3 11H5Z"
      fill="currentColor"
    />
    <path d="M17.3 9.8 13.2 31.5M27.9 12.8l-2.8 18.7" stroke="white" strokeWidth="2.8" strokeLinecap="round" />
  </svg>
)

const getSportIcon = (sport?: string) => {
  const normalized = sport?.toLowerCase() || ''
  if (normalized.includes('bike') || normalized.includes('ride') || normalized.includes('cycling')) {
    return <Bike className="size-5" />
  }
  return <Footprints className="size-5" />
}

const getSportTone = (sport?: string) => {
  const normalized = sport?.toLowerCase() || ''
  return normalized.includes('bike') || normalized.includes('ride') || normalized.includes('cycling')
    ? 'bg-emerald-100 text-emerald-600'
    : 'bg-blue-100 text-primary'
}

const getReviewAccent = (sport: string | undefined, index: number) => {
  const normalized = sport?.toLowerCase() || ''
  if (normalized.includes('run')) return 'blue'
  if (index % 4 === 3) return 'orange'
  return 'emerald'
}

const getDefaultLanguage = (): Language => {
  if (typeof navigator === 'undefined') return 'zh'

  const systemLanguage = navigator.languages?.find(Boolean) || navigator.language || ''
  if (!systemLanguage) return 'zh'

  return systemLanguage.toLowerCase().startsWith('zh') ? 'zh' : 'en'
}

function App() {
  const [files, setFiles] = useState<FitFileData[]>([])
  const [mergeOptions, setMergeOptions] = useState<MergeOptions>({
    sortChronologically: true,
    preserveAllData: true,
    removeDuplicateTimestamps: true,
  })
  const [mergedData, setMergedData] = useState<Blob | null>(null)
  const [isMerging, setIsMerging] = useState(false)
  const [mergeProgress, setMergeProgress] = useState(0)
  const [isDownloading, setIsDownloading] = useState(false)
  const [language, setLanguage] = useState<Language>(getDefaultLanguage)
  const [currentStep, setCurrentStep] = useState<FlowStep>(1)
  const addMoreInputRef = useRef<HTMLInputElement>(null)
  const demoMode =
    import.meta.env.DEV && typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('demo')
      : null

  const t = useTranslations(language)
  const parsedFiles = files.filter((file) => file.status === 'parsed')
  const errorFiles = files.filter((file) => file.status === 'error')
  const canMerge = parsedFiles.length >= 2

  const mergedStats = useMemo(() => {
    if (demoMode === 'preview') {
      return {
        totalDistance: 89.32,
        totalDuration: 3 * 3600 + 45 * 60 + 18,
        totalElevation: 1786,
      }
    }

    const totalDistance = parsedFiles.reduce((sum, file) => sum + (file.metadata?.distance || 0), 0)
    const totalDuration = parsedFiles.reduce((sum, file) => sum + (file.metadata?.duration || 0), 0)
    const totalElevation = parsedFiles.reduce((sum, file) => sum + (file.metadata?.totalAscent || 0), 0)

    return { totalDistance, totalDuration, totalElevation }
  }, [demoMode, parsedFiles])

  const steps: Array<{ id: FlowStep; pill: string; label: string }> = [
    { id: 1, pill: t.stepOnePill, label: t.stepOneTitle },
    { id: 2, pill: t.stepTwoPill, label: t.stepReview },
    { id: 3, pill: t.stepThreePill, label: t.stepDownload },
  ]

  const invalidateMergedData = () => setMergedData(null)

  const toggleLanguage = () => {
    setLanguage((current) => (current === 'en' ? 'zh' : 'en'))
  }

  const handleReturnToUpload = () => {
    invalidateMergedData()
    setFiles([])
    setMergeProgress(0)
    setIsMerging(false)
    setCurrentStep(1)
  }

  useEffect(() => {
    if (!import.meta.env.DEV) return

    if (demoMode !== 'review' && demoMode !== 'preview') return

    let cancelled = false

    const loadDemoFiles = async () => {
      const demoFiles = await Promise.all(
        demoActivities.map(async (activity, index) => {
          const response = await fetch(activity.source)
          const blob = await response.blob()
          const file = new File([blob], activity.name, { type: 'application/octet-stream' })
          const result = await parseFitFile(file)

          return {
            id: `demo-${index}`,
            name: activity.name,
            file,
            parsed: result.data,
            metadata: {
              activityType: activity.sport,
              sport: activity.sport,
              duration: activity.duration,
              distance: activity.distance,
              startTime: activity.startTime,
              totalAscent: activity.totalAscent,
            },
            status: 'parsed' as const,
          }
        })
      )

      if (cancelled) return

      setFiles(demoFiles)
      setCurrentStep(demoMode === 'preview' ? 3 : 2)

      if (demoMode === 'preview') {
        setMergedData(new Blob([new Uint8Array([0])], { type: 'application/octet-stream' }))
      }
    }

    void loadDemoFiles().catch((error) => {
      console.error('Failed to load demo files', error)
    })

    return () => {
      cancelled = true
    }
  }, [demoMode])

  useEffect(() => {
    if (!isMerging) return

    setMergeProgress(0)

    const startedAt = performance.now()
    let frameId = 0

    const tick = (now: number) => {
      const elapsed = now - startedAt
      const nextProgress =
        elapsed <= 2000
          ? (elapsed / 2000) * 80
          : 80 + Math.min((elapsed - 2000) / 10000, 1) * 15

      setMergeProgress(Math.min(nextProgress, 95))
      frameId = requestAnimationFrame(tick)
    }

    frameId = requestAnimationFrame(tick)

    return () => cancelAnimationFrame(frameId)
  }, [isMerging])

  const handleFilesSelected = async (newFiles: File[]) => {
    if (newFiles.length === 0) return

    invalidateMergedData()

    let hashedFiles: Array<{ file: File; fileHash: string }>

    try {
      hashedFiles = await Promise.all(
        newFiles.map(async (file) => ({
          file,
          fileHash: await calculateFileMd5(file),
        }))
      )
    } catch {
      toast.error('Failed to fingerprint selected files.')
      return
    }

    const existingHashes = new Set(files.map((file) => file.fileHash).filter(Boolean))
    const newHashes = new Set<string>()
    const uniqueFiles: Array<{ file: File; fileHash: string }> = []
    let duplicateCount = 0

    hashedFiles.forEach((hashedFile) => {
      if (existingHashes.has(hashedFile.fileHash) || newHashes.has(hashedFile.fileHash)) {
        duplicateCount += 1
        return
      }

      newHashes.add(hashedFile.fileHash)
      uniqueFiles.push(hashedFile)
    })

    if (duplicateCount > 0) {
      toast.warning(
        `Skipped ${duplicateCount} duplicate FIT file${duplicateCount === 1 ? '' : 's'}.`
      )
    }

    if (uniqueFiles.length === 0) return

    const createdAt = Date.now()
    const fileDataArray: FitFileData[] = uniqueFiles.map(({ file, fileHash }) => ({
      id: `${fileHash}-${createdAt}-${Math.random()}`,
      name: file.name,
      file,
      fileHash,
      status: 'pending',
    }))

    setFiles((previous) => [...previous, ...fileDataArray])
    if (currentStep === 1) setCurrentStep(2)

    for (const fileData of fileDataArray) {
      setFiles((previous) =>
        previous.map((file) => (file.id === fileData.id ? { ...file, status: 'parsing' } : file))
      )

      try {
        const result = await parseFitFile(fileData.file)
        setFiles((previous) =>
          previous.map((file) =>
            file.id === fileData.id
              ? {
                  ...file,
                  status: 'parsed',
                  parsed: result.data,
                  metadata: result.metadata,
                }
              : file
          )
        )
        toast.success(`${fileData.name} ${t.parseSuccess}`)
      } catch (error) {
        const message = error instanceof Error ? error.message : t.parseFailed
        setFiles((previous) =>
          previous.map((file) =>
            file.id === fileData.id
              ? {
                  ...file,
                  status: 'error',
                  error: message,
                }
              : file
          )
        )
        toast.error(`${t.parseFailed}: ${fileData.name}`)
      }
    }
  }

  const handleAdditionalFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      void handleFilesSelected(Array.from(event.target.files))
      event.target.value = ''
    }
  }

  const handleRemoveFile = (id: string) => {
    invalidateMergedData()
    setFiles((previous) => {
      const nextFiles = previous.filter((file) => file.id !== id)
      if (nextFiles.length === 0) setCurrentStep(1)
      return nextFiles
    })
  }

  const handleContinueToPreview = async () => {
    if (!canMerge) {
      toast.error(t.needTwoFiles)
      return
    }

    setIsMerging(true)
    try {
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
      const merged = await mergeFitFilesInWorker(parsedFiles, mergeOptions)
      setMergeProgress(100)
      await new Promise((resolve) => window.setTimeout(resolve, 360))
      setMergedData(merged)
      setCurrentStep(3)
    } catch (error) {
      const message = error instanceof Error ? error.message : t.mergeError
      toast.error(message)
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
    } catch {
      toast.error(t.mergeError)
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <>
      <div className="app-shell">
        <header className="relative z-10 border-b border-border/70 bg-white/90 backdrop-blur-xl">
          <div className="mx-auto flex h-[4.85rem] max-w-[100rem] items-center justify-between px-6 lg:px-10">
            <div className="flex items-center gap-4">
              <LogoMark />
              <span className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                {t.title}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-2 text-sm font-medium text-muted-foreground md:inline-flex">
                <Shield className="size-4 text-primary" />
                {t.privacyHeader}
              </div>
              <Button
                type="button"
                variant="outline"
                className="rounded-full px-4"
                onClick={toggleLanguage}
                aria-label={t.languageLabel}
              >
                <Languages className="size-4" />
                {language === 'en' ? '\u4e2d\u6587' : 'English'}
              </Button>
            </div>
          </div>
        </header>

        <main className="relative min-h-[calc(100vh-4.85rem)] overflow-hidden">
          <div className="scenic-backdrop" />
          <div className="mountain-haze mountain-haze-left" />
          <div className="mountain-haze mountain-haze-right" />

          <div
            className={`relative z-[1] mx-auto max-w-[96rem] px-4 sm:px-6 lg:px-10 ${
              currentStep === 3 ? 'py-5' : 'py-8'
            }`}
          >
            <section className="mx-auto max-w-5xl text-center">
              <div className="mb-7 flex flex-wrap items-center justify-center gap-3 text-sm font-semibold text-slate-500">
                {steps.map((step, index) => {
                  const isActive = step.id === currentStep
                  const isDone = step.id < currentStep

                  return (
                    <div key={step.id} className="flex items-center gap-3">
                      <div className="flex items-center gap-3">
                        {isActive && (
                          <span className="rounded-full border border-primary/15 bg-white px-4 py-2 text-primary shadow-sm">
                            {step.pill}
                          </span>
                        )}
                        <span
                          className={
                            isDone
                              ? 'inline-flex items-center gap-1.5 text-slate-700'
                              : isActive
                                ? 'text-slate-800'
                                : 'text-slate-400'
                          }
                        >
                          {isDone && <Check className="size-4 text-primary" />}
                          {step.label}
                        </span>
                      </div>
                      {index < steps.length - 1 && (
                        <ChevronRight className="size-4 text-slate-400" />
                      )}
                    </div>
                  )
                })}
              </div>

              {currentStep === 1 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 12 }}
                >
                  <h1 className="mx-auto max-w-6xl text-4xl font-bold tracking-tight text-balance text-slate-950 sm:text-5xl lg:text-[3.35rem]">
                    {t.heroTitle}
                  </h1>
                  <p className="mx-auto mt-4 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg">
                    {t.heroDescription}
                  </p>
                </motion.div>
              )}
            </section>

            {currentStep === 1 && (
              <section className="mx-auto mt-12 max-w-[61.5rem]">
                <div className="overflow-hidden rounded-[1.25rem] border border-dashed border-primary/45 bg-white/82 px-5 py-5 shadow-[0_22px_70px_rgba(15,23,42,0.045)] backdrop-blur-sm sm:px-7 sm:py-6">
                  <FileUploadZone onFilesSelected={handleFilesSelected} t={t} variant="hero" />

                  <div className="mt-5 grid gap-4 border-t border-slate-200/80 pt-5 sm:grid-cols-3">
                    <div className="flex items-center justify-center gap-3 sm:border-r sm:border-border/70">
                      <span className="inline-flex size-11 items-center justify-center rounded-full bg-blue-100 text-primary">
                        <LockKeyhole className="size-5" />
                      </span>
                      <p className="max-w-[9rem] text-sm font-semibold leading-6 text-slate-700">
                        {t.browserProcessing}
                      </p>
                    </div>
                    <div className="flex items-center justify-center gap-3 sm:border-r sm:border-border/70">
                      <span className="inline-flex size-11 items-center justify-center rounded-full bg-blue-100 text-primary">
                        <MapPinned className="size-5" />
                      </span>
                      <p className="max-w-[9rem] text-sm font-semibold leading-6 text-slate-700">
                        {t.compatibilityLabel}
                      </p>
                    </div>
                    <div className="flex items-center justify-center gap-3">
                      <span className="inline-flex size-11 items-center justify-center rounded-full bg-blue-100 text-primary">
                        <Layers3 className="size-5" />
                      </span>
                      <p className="max-w-[9rem] text-sm font-semibold leading-6 text-slate-700">
                        {t.uploadSupport}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-14 text-center">
                  <h2 className="text-2xl font-semibold tracking-tight">{t.howItWorksTitle}</h2>
                  <div className="mx-auto mt-7 grid max-w-4xl gap-8 sm:grid-cols-3">
                    {[
                      { number: 1, title: t.stepOneTitle, copy: t.stepOneSubtitle },
                      { number: 2, title: t.stepTwoTitle, copy: t.stepTwoSubtitle },
                      { number: 3, title: t.stepThreeTitle, copy: t.stepThreeSubtitle },
                    ].map((item, index) => (
                      <div key={item.number} className="relative px-4 text-center">
                        {index > 0 && (
                          <div className="absolute right-1/2 top-5 hidden h-px w-full border-t border-dashed border-primary/25 sm:block" />
                        )}
                        <div className="relative mx-auto inline-flex size-11 items-center justify-center rounded-full bg-blue-100 text-base font-semibold text-primary shadow-sm">
                          {item.number}
                        </div>
                        <h3 className="mt-5 text-base font-semibold">{item.title}</h3>
                        <p className="mx-auto mt-2 max-w-[13rem] text-sm leading-6 text-muted-foreground">
                          {item.copy}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {currentStep === 2 && (
              <section className="mx-auto mt-6 max-w-[72.5rem] sm:mt-8">
                <div className="mb-5 flex flex-col gap-4">
                  <div className="flex flex-wrap items-center gap-4 text-base font-semibold text-slate-800">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-12 rounded-xl bg-white/92 px-5 font-semibold text-slate-900 shadow-[0_8px_24px_rgba(15,23,42,0.08)]"
                      onClick={handleReturnToUpload}
                      disabled={isMerging}
                    >
                      <ChevronLeft className="size-4" />
                      {t.back}
                    </Button>
                    <div className="flex min-w-0 flex-wrap items-center gap-3 text-[1.05rem] sm:text-xl">
                      <span className="text-slate-900">
                        {files.length} {t.filesSelected}
                      </span>
                      <span className="size-1.5 rounded-full bg-slate-400" />
                      <span className="inline-flex items-center gap-2 text-emerald-600">
                        {parsedFiles.length} {t.validFiles}
                        <CheckCircle2 className="size-5" />
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <MergeOptionsDialog
                      options={mergeOptions}
                      onOptionsChange={(nextOptions) => {
                        setMergeOptions(nextOptions)
                        invalidateMergedData()
                      }}
                      t={t}
                      disabled={isMerging}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="h-12 rounded-xl bg-white/92 px-5 font-semibold shadow-[0_8px_24px_rgba(15,23,42,0.08)]"
                      onClick={() => addMoreInputRef.current?.click()}
                      disabled={isMerging}
                    >
                      <FilePlus2 className="size-4" />
                      {t.addMore}
                    </Button>
                  </div>
                </div>

                <div className="flex min-w-0 flex-col gap-3.5">
                  {files.map((file, index) => (
                    <FileListItem
                      key={file.id}
                      fileData={file}
                      onRemove={() => handleRemoveFile(file.id)}
                      lang={language}
                      t={t}
                      showTrack
                      accent={getReviewAccent(file.metadata?.sport, index)}
                    />
                  ))}
                </div>

                {errorFiles.length > 0 && (
                  <Alert variant="destructive" className="mt-4 rounded-[1.25rem]">
                    <AlertTitle>
                      {errorFiles.length} {t.invalidFiles}
                    </AlertTitle>
                    <AlertDescription>{t.queueHint}</AlertDescription>
                  </Alert>
                )}

                <div className="sticky bottom-0 z-20 -mx-4 mt-6 bg-gradient-to-t from-background via-background/95 to-transparent px-4 pb-5 pt-6 lg:static lg:mx-0 lg:flex lg:justify-end lg:bg-transparent lg:p-0">
                  <Button
                    type="button"
                    size="lg"
                    className="h-14 w-full rounded-xl text-base font-semibold shadow-[0_18px_42px_rgba(37,99,235,0.22)] lg:w-auto lg:rounded-full lg:px-7"
                    onClick={handleContinueToPreview}
                    disabled={!canMerge || isMerging}
                  >
                    {isMerging ? t.merging : t.continueToPreview}
                    <ChevronRight className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="mx-auto mt-3 flex h-11 text-primary lg:hidden"
                    onClick={handleReturnToUpload}
                    disabled={isMerging}
                  >
                    <ChevronLeft className="size-4" />
                    {t.back}
                  </Button>
                </div>
              </section>
            )}

            {currentStep === 3 && (
              <section className="mx-auto mt-4 max-w-[82rem]">
                <div className="mb-4 flex items-center">
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    className="h-11 rounded-lg bg-white/90 px-6 font-semibold shadow-sm"
                    onClick={() => setCurrentStep(2)}
                  >
                    {t.back}
                  </Button>
                </div>

                <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_26rem]">
                  <div className="space-y-6">
                    <TrackMap
                      files={parsedFiles}
                      t={t}
                      inline
                      minimal
                      staticPreview={demoMode === 'preview'}
                    />

                    <Card className="overflow-hidden rounded-xl border-border/70 bg-white/88 py-0 shadow-[0_20px_70px_rgba(15,23,42,0.05)] backdrop-blur-sm">
                      <CardContent className="p-6">
                        <div className="mb-4 flex items-center justify-between gap-3">
                          <h3 className="text-lg font-semibold text-slate-900">
                            {t.sourceFiles} ({parsedFiles.length})
                          </h3>
                        </div>

                        <div className="flex flex-col gap-3">
                          {parsedFiles.map((file) => (
                            <div
                              key={file.id}
                              className="grid items-center gap-3 text-sm md:grid-cols-[1.45fr_0.55fr_0.9fr_0.8fr_0.7fr]"
                            >
                              <div className="flex min-w-0 items-center gap-3">
                                <span
                                  className={`inline-flex size-8 shrink-0 items-center justify-center rounded-full ${getSportTone(file.metadata?.sport)}`}
                                >
                                  {getSportIcon(file.metadata?.sport)}
                                </span>
                                <p className="truncate font-semibold text-slate-900">{file.name}</p>
                              </div>
                              <p className="flex items-center gap-2 font-semibold text-slate-600 capitalize">
                                <span
                                  className={`inline-flex size-2 rounded-full ${getSportTone(file.metadata?.sport).includes('emerald') ? 'bg-emerald-400' : 'bg-blue-300'}`}
                                />
                                {file.metadata?.sport || 'Activity'}
                              </p>
                              <p className="flex items-center gap-2 text-slate-500">
                                <Calendar className="size-4" />
                                {formatActivityDate(file.metadata?.startTime).date}
                              </p>
                              <p className="text-slate-500">
                                {formatActivityDate(file.metadata?.startTime).time}
                              </p>
                              <p className="font-semibold text-slate-600">
                                {formatDistance(file.metadata?.distance)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                  </div>

                  <div className="space-y-6">
                    <Card className="overflow-hidden rounded-xl border-border/70 bg-white/88 py-0 shadow-[0_20px_70px_rgba(15,23,42,0.05)] backdrop-blur-sm">
                      <CardContent className="space-y-4 p-6">
                        <div className="flex items-center gap-3">
                          <div className="inline-flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <Route className="size-5" />
                          </div>
                          <h3 className="text-lg font-semibold">{t.mergedSummary}</h3>
                        </div>

                        <div className="grid grid-cols-2 border-y border-border/70">
                          {[
                            {
                              label: t.totalDistance,
                              value: formatDistance(mergedStats.totalDistance),
                              icon: <MapPinned className="size-5" />,
                            },
                            {
                              label: t.totalTime,
                              value: formatClockDuration(mergedStats.totalDuration),
                              icon: <Clock3 className="size-5" />,
                            },
                            {
                              label: t.mergedActivities,
                              value: `${parsedFiles.length} ${t.filesReady}`,
                              icon: <Layers3 className="size-5" />,
                            },
                            {
                              label: t.elevation,
                              value: `${new Intl.NumberFormat('en-US').format(Math.round(mergedStats.totalElevation))} m`,
                              icon: <Route className="size-5" />,
                            },
                          ].map((item, index) => (
                            <div
                              key={item.label}
                              className={`flex gap-4 px-3 py-5 ${
                                index % 2 === 0 ? 'border-r border-border/70' : ''
                              } ${index < 2 ? 'border-b border-border/70' : ''}`}
                            >
                              <span className="mt-1 text-primary">{item.icon}</span>
                              <span>
                                <span className="block text-sm font-semibold text-slate-500">
                                  {item.label}
                                </span>
                                <span className="mt-2 block text-[1.35rem] font-bold leading-tight text-slate-950">
                                  {item.value}
                                </span>
                              </span>
                            </div>
                          ))}
                        </div>

                        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-emerald-700">
                          <div className="flex items-center gap-3">
                            <span className="inline-flex size-9 items-center justify-center rounded-full bg-emerald-500 text-white">
                              <CheckCircle2 className="size-5" />
                            </span>
                            <div>
                              <p className="text-base font-semibold">{t.mergePreviewLooksGreat}</p>
                              <p className="mt-1 text-sm">{t.mergePreviewMessage}</p>
                            </div>
                          </div>
                        </div>

                        <Button
                          type="button"
                          size="lg"
                          className="h-[3.75rem] w-full rounded-md text-base font-semibold"
                          onClick={handleDownload}
                          disabled={!mergedData || isDownloading}
                        >
                          <Download className="size-5" />
                          {isDownloading ? t.downloading : t.download}
                        </Button>

                        <p className="text-center text-xs leading-6 text-muted-foreground">
                          {t.browserProcessing} · {t.localOnlyHint}
                        </p>
                      </CardContent>
                    </Card>

                  </div>
                </div>
              </section>
            )}
          </div>
        </main>
      </div>

      {currentStep === 2 && (
        <motion.div
          className={`fixed inset-0 z-40 flex items-center justify-center bg-slate-950/18 px-4 backdrop-blur-[2px] ${
            isMerging ? 'pointer-events-auto' : 'pointer-events-none'
          }`}
          initial={false}
          animate={{ opacity: isMerging ? 1 : 0.001 }}
          transition={{ duration: 0.18 }}
          role="status"
          aria-live="polite"
          aria-hidden={!isMerging}
        >
          <motion.div
            initial={false}
            animate={{
              opacity: isMerging ? 1 : 0.001,
              y: isMerging ? 0 : 18,
              scale: isMerging ? 1 : 0.96,
            }}
            transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-[36rem] overflow-hidden rounded-xl border border-primary/20 bg-white shadow-[0_28px_90px_rgba(15,23,42,0.18)]"
          >
            <div className="grid items-center gap-5 px-5 py-6 sm:grid-cols-[12rem_1fr] sm:px-6">
              <div className="mx-auto h-36 w-44 overflow-hidden rounded-lg border border-blue-100 bg-blue-50/70">
                <LottieAnimation
                  animationData={cyclingAnimation}
                  className="h-full w-full"
                  ariaLabel={t.merging}
                  active={isMerging}
                />
              </div>
              <div>
                <p className="text-lg font-semibold text-slate-950">{t.merging}</p>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                  {t.mergeInProgressMessage}
                </p>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-blue-100">
                  <motion.div
                    className="h-full rounded-full bg-primary"
                    initial={false}
                    animate={{ width: `${mergeProgress}%` }}
                    transition={{ duration: 0.18, ease: 'easeOut' }}
                  />
                </div>
                <p className="mt-2 text-xs font-semibold text-slate-500">
                  {Math.round(mergeProgress)}%
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      <input
        ref={addMoreInputRef}
        type="file"
        accept=".fit,.FIT"
        multiple
        className="hidden"
        onChange={handleAdditionalFileInput}
      />
      <Toaster position="top-right" richColors />
    </>
  )
}

export default App
