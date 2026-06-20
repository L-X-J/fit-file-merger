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
  Trash2,
} from 'lucide-react'

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
  mergeFitFiles,
  parseFitFile,
} from '@/lib/fitParser'
import { useTranslations, type Language } from '@/lib/i18n'
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

const getFileDevice = (file: FitFileData) =>
  demoActivities.find((activity) => activity.name === file.name)?.device ||
  (file.metadata?.sport ? `${file.metadata.sport} activity` : 'Garmin activity')

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
  const [language, setLanguage] = useState<Language>('en')
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
    invalidateMergedData()

    const fileDataArray: FitFileData[] = newFiles.map((file) => ({
      id: `${file.name}-${Date.now()}-${Math.random()}`,
      name: file.name,
      file,
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
      const merged = await mergeFitFiles(parsedFiles, mergeOptions)
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
                {language === 'en' ? '中文' : 'English'}
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
              <section className="mx-auto mt-8 max-w-[72.5rem]">
                <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap items-center gap-3 text-base font-semibold text-slate-800">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-11 rounded-lg bg-white/90 px-5 font-semibold text-slate-900 shadow-sm"
                      onClick={() => setCurrentStep(1)}
                      disabled={isMerging}
                    >
                      <ChevronLeft className="size-4" />
                      {t.back}
                    </Button>
                    <span>
                      {files.length} {t.filesSelected}
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="inline-flex items-center gap-2 text-emerald-600">
                      {parsedFiles.length} {t.validFiles}
                      <CheckCircle2 className="size-4" />
                    </span>
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
                      className="h-11 rounded-lg bg-white/90 px-6 font-semibold shadow-sm"
                      onClick={() => addMoreInputRef.current?.click()}
                      disabled={isMerging}
                    >
                      <FilePlus2 className="size-4" />
                      {t.addMore}
                    </Button>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  {files.map((file) => (
                    <div
                      key={file.id}
                      className="grid min-h-[5.75rem] items-center gap-4 rounded-xl border border-border/70 bg-white/88 px-5 py-4 shadow-[0_8px_26px_rgba(15,23,42,0.035)] backdrop-blur-sm md:grid-cols-[1.6fr_0.56fr_0.9fr_0.68fr_0.74fr_0.72fr_auto]"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-4">
                          <span
                            className={`inline-flex size-12 shrink-0 items-center justify-center rounded-full ${getSportTone(file.metadata?.sport)}`}
                          >
                            {getSportIcon(file.metadata?.sport)}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-[1.05rem] font-semibold text-foreground">
                              {file.name}
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {getFileDevice(file)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-sm font-semibold text-slate-800">
                        <span
                          className={`inline-flex size-2.5 rounded-full ${getSportTone(file.metadata?.sport).includes('emerald') ? 'bg-emerald-400' : 'bg-blue-300'}`}
                        />
                        {file.metadata?.sport || 'Activity'}
                      </div>

                      <div className="flex items-center gap-3 text-sm text-slate-500">
                        <Calendar className="size-4" />
                        <span>
                          <span className="block font-semibold text-slate-700">
                            {formatActivityDate(file.metadata?.startTime).date}
                          </span>
                          <span className="text-xs font-semibold text-slate-500">
                            {formatActivityDate(file.metadata?.startTime).time}
                          </span>
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-sm text-slate-500">
                        <Clock3 className="size-4" />
                        <span>
                          <span className="block font-semibold text-slate-900">
                            {formatClockDuration(file.metadata?.duration)}
                          </span>
                          <span className="text-xs font-semibold text-slate-500">{t.duration}</span>
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-sm text-slate-500">
                        <MapPinned className="size-4" />
                        <span>
                          <span className="block font-semibold text-slate-900">
                            {formatDistance(file.metadata?.distance)}
                          </span>
                          <span className="text-xs font-semibold text-slate-500">{t.distance}</span>
                        </span>
                      </div>

                      <div className="flex items-center justify-end gap-3">
                        <div className="flex items-center gap-3">
                          <span
                            className={`inline-flex size-5 items-center justify-center rounded-full ${
                              file.status === 'parsed'
                                ? 'bg-emerald-100 text-emerald-700'
                                : file.status === 'error'
                                  ? 'bg-rose-100 text-rose-700'
                                  : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            <Check className="size-3" />
                          </span>
                          <span
                            className={`text-sm font-semibold ${
                              file.status === 'parsed'
                                ? 'text-emerald-700'
                                : file.status === 'error'
                                  ? 'text-rose-700'
                                  : 'text-slate-600'
                            }`}
                          >
                            <span className="block">
                              {file.status === 'parsed'
                                ? t.parsed
                                : file.status === 'error'
                                  ? t.error
                                  : file.status === 'parsing'
                                    ? t.parsing
                                    : t.pending}
                            </span>
                            <span className="text-xs text-slate-500">{t.parseSuccess}</span>
                          </span>
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-9 rounded-lg border border-border/70 bg-white/80"
                        onClick={() => handleRemoveFile(file.id)}
                        aria-label={`${t.removeFile}: ${file.name}`}
                      >
                        <Trash2 className="size-4" />
                      </Button>

                      {file.status === 'error' && file.error && (
                        <div className="md:col-span-7">
                          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                            {file.error}
                          </div>
                        </div>
                      )}
                    </div>
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

                {errorFiles.length === 0 && files.length > 0 && (
                  <div className="mt-5 rounded-[1.25rem] border border-primary/20 bg-white/75 px-5 py-5 shadow-[0_16px_50px_rgba(15,23,42,0.04)]">
                    <div className="flex items-center gap-4">
                      <span className="inline-flex size-12 items-center justify-center rounded-full bg-blue-100 text-primary">
                        <Shield className="size-5" />
                      </span>
                      <div>
                        <p className="text-lg font-semibold text-primary">{t.allGood}</p>
                        <p className="mt-1 text-sm font-medium text-slate-700">{t.allFilesReady}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-5 flex justify-end">
                  <Button
                    type="button"
                    size="lg"
                    className="rounded-full px-6"
                    onClick={handleContinueToPreview}
                    disabled={!canMerge || isMerging}
                  >
                    {isMerging ? t.merging : t.continueToPreview}
                    <ChevronRight className="size-4" />
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
