export type Language = 'en' | 'zh'

type TranslationDictionary = {
  title: string
  subtitle: string
  privacyNote: string
  browserProcessing: string
  localOnlyHint: string
  uploadTitle: string
  uploadDescription: string
  uploadSupport: string
  selectFiles: string
  uploadedFiles: string
  addMore: string
  uploadWarning: string
  queueHint: string
  removeFile: string
  parsing: string
  parsed: string
  error: string
  pending: string
  sport: string
  duration: string
  distance: string
  startTime: string
  mergeOptions: string
  mergeOptionsHint: string
  sortChronologically: string
  sortDescription: string
  preserveAllData: string
  preserveDescription: string
  removeDuplicates: string
  removeDuplicatesDescription: string
  download: string
  mergeAndDownload: string
  merging: string
  downloading: string
  parseSuccess: string
  parseFailed: string
  mergeError: string
  mergeSuccess: string
  downloadedAs: string
  needTwoFiles: string
  mapView: string
  totalDistance: string
  totalTime: string
  movingTime: string
  avgSpeed: string
  maxSpeed: string
  elevation: string
  closeMap: string
  back: string
  startOver: string
  mergedTrack: string
  filesReady: string
  previewTitle: string
  previewDescription: string
  heroTitle: string
  heroDescription: string
  howItWorksTitle: string
  howItWorksDescription: string
  stepUpload: string
  stepReview: string
  stepDownload: string
  compatibilityLabel: string
  previewLabel: string
  readyToMerge: string
  localFirst: string
  noFilesYet: string
  noFilesDescription: string
  noTrackData: string
  noTrackDescription: string
  invalidFiles: string
  validFiles: string
  languageLabel: string
  avgPower: string
  maxPower: string
  mergeReady: string
  stepOnePill: string
  stepTwoPill: string
  stepThreePill: string
  stepOneTitle: string
  stepTwoTitle: string
  stepThreeTitle: string
  stepOneSubtitle: string
  stepTwoSubtitle: string
  stepThreeSubtitle: string
  privacyHeader: string
  learnMore: string
  continueToPreview: string
  continueToDownload: string
  allGood: string
  allFilesReady: string
  mergedSummary: string
  mergedActivities: string
  mergePreviewLooksGreat: string
  mergePreviewMessage: string
  editSettings: string
  smartMerge: string
  smartMergeDescription: string
  sourceFiles: string
  filesSelected: string
}

export type Translations = TranslationDictionary

export const translations: Record<Language, TranslationDictionary> = {
  en: {
    title: 'FIT Merge',
    subtitle:
      'Combine Garmin, Polar, and Suunto FIT activities into a single clean file with a simple three-step flow.',
    privacyNote: 'Your files stay private',
    browserProcessing: 'Processed locally in your browser',
    localOnlyHint: 'Your files never leave your device',
    uploadTitle: 'Drag and drop your FIT files here',
    uploadDescription: 'Add one or more FIT files from your device to get started.',
    uploadSupport: 'You can select multiple files',
    selectFiles: 'Select FIT Files',
    uploadedFiles: 'Selected files',
    addMore: 'Add more files',
    uploadWarning: 'Add at least 2 valid FIT files before continuing.',
    queueHint: 'Review your selected activities and make sure everything looks correct.',
    removeFile: 'Remove file',
    parsing: 'Parsing',
    parsed: 'Valid',
    error: 'Error',
    pending: 'Waiting',
    sport: 'Sport',
    duration: 'Duration',
    distance: 'Distance',
    startTime: 'Start time',
    mergeOptions: 'Merge settings',
    mergeOptionsHint: 'Use a simple chronological merge for the cleanest result.',
    sortChronologically: 'Sort chronologically',
    sortDescription: 'Keep all records in time order across the merged activity.',
    preserveAllData: 'Preserve all data',
    preserveDescription: 'Keep supported metrics from the original files whenever possible.',
    removeDuplicates: 'Remove duplicate timestamps',
    removeDuplicatesDescription: 'Skip overlapping records that share the same timestamp.',
    download: 'Download Merged FIT File',
    mergeAndDownload: 'Merge and download',
    merging: 'Preparing merged preview',
    downloading: 'Preparing download',
    parseSuccess: 'parsed successfully',
    parseFailed: 'Failed to parse',
    mergeError: 'Failed to merge files',
    mergeSuccess: 'Merged file is ready.',
    downloadedAs: 'Downloaded as',
    needTwoFiles: 'At least 2 valid files are required.',
    mapView: 'Merged route',
    totalDistance: 'Total Distance',
    totalTime: 'Total Duration',
    movingTime: 'Moving Time',
    avgSpeed: 'Average Speed',
    maxSpeed: 'Max Speed',
    elevation: 'Elevation Gain',
    closeMap: 'Close map',
    back: 'Back',
    startOver: 'Start over',
    mergedTrack: 'Merged route',
    filesReady: 'files ready',
    previewTitle: 'Preview merged activity',
    previewDescription:
      'Everything looks good! Review the merged result and download your new FIT file.',
    heroTitle: 'Merge your FIT files into one.',
    heroDescription:
      'Combine multiple Garmin, Polar, or Suunto FIT files into a single clean file.',
    howItWorksTitle: 'How it works',
    howItWorksDescription: 'A quick three-step flow from upload to download.',
    stepUpload: 'Select files',
    stepReview: 'Preview',
    stepDownload: 'Download',
    compatibilityLabel: 'Supports Garmin, Polar, Suunto',
    previewLabel: 'Route preview before download',
    readyToMerge: 'Ready to continue',
    localFirst: 'Processed locally',
    noFilesYet: 'No files selected yet',
    noFilesDescription: 'Choose your FIT files to review them before merging.',
    noTrackData: 'No merged preview yet',
    noTrackDescription: 'Merge two or more valid FIT files to preview the combined route.',
    invalidFiles: 'invalid files',
    validFiles: 'valid',
    languageLabel: 'Language',
    avgPower: 'Average Power',
    maxPower: 'Max Power',
    mergeReady: 'Ready for download',
    stepOnePill: 'Step 1 of 3',
    stepTwoPill: 'Step 2 of 3',
    stepThreePill: 'Step 3 of 3',
    stepOneTitle: 'Select files',
    stepTwoTitle: 'Review your files',
    stepThreeTitle: 'Preview merged activity',
    stepOneSubtitle: 'Add one or more FIT files from your device.',
    stepTwoSubtitle: 'Please confirm that your activities look correct before we merge them.',
    stepThreeSubtitle: 'Everything looks good! Review the merged result and download your new FIT file.',
    privacyHeader: 'Your files stay private',
    learnMore: 'Learn more',
    continueToPreview: 'Continue to Merge Preview',
    continueToDownload: 'Continue to Download',
    allGood: 'All good!',
    allFilesReady: 'All selected files are valid and ready to merge.',
    mergedSummary: 'Merged activity summary',
    mergedActivities: 'Merged Activities',
    mergePreviewLooksGreat: 'Merge preview looks great!',
    mergePreviewMessage: 'Your activities have been combined successfully.',
    editSettings: 'Edit settings',
    smartMerge: 'Smart merge (recommended)',
    smartMergeDescription: 'Automatically combine activities in chronological order.',
    sourceFiles: 'Source files',
    filesSelected: 'files selected',
  },
  zh: {
    title: 'FIT 合并',
    subtitle: '用清晰的三步流程，把 Garmin、Polar、Suunto 的 FIT 活动合并成一个干净文件。',
    privacyNote: '你的文件保持私密',
    browserProcessing: '在浏览器本地处理',
    localOnlyHint: '文件不会离开你的设备',
    uploadTitle: '将 FIT 文件拖到这里',
    uploadDescription: '从设备中添加一个或多个 FIT 文件开始。',
    uploadSupport: '支持一次选择多个文件',
    selectFiles: '选择 FIT 文件',
    uploadedFiles: '已选择文件',
    addMore: '继续添加文件',
    uploadWarning: '继续前请至少添加 2 个有效的 FIT 文件。',
    queueHint: '检查你选择的活动文件，确认内容都正确。',
    removeFile: '移除文件',
    parsing: '解析中',
    parsed: '有效',
    error: '错误',
    pending: '等待中',
    sport: '运动类型',
    duration: '时长',
    distance: '距离',
    startTime: '开始时间',
    mergeOptions: '合并设置',
    mergeOptionsHint: '使用简单的按时间顺序合并，通常能得到最干净的结果。',
    sortChronologically: '按时间排序',
    sortDescription: '让合并后的所有记录按时间顺序排列。',
    preserveAllData: '保留全部数据',
    preserveDescription: '尽量保留原始文件中支持的指标。',
    removeDuplicates: '移除重复时间戳',
    removeDuplicatesDescription: '跳过时间戳相同的重叠记录。',
    download: '下载合并后的 FIT 文件',
    mergeAndDownload: '合并并下载',
    merging: '正在生成合并预览',
    downloading: '正在准备下载',
    parseSuccess: '解析成功',
    parseFailed: '解析失败',
    mergeError: '合并文件失败',
    mergeSuccess: '合并文件已准备好。',
    downloadedAs: '已下载为',
    needTwoFiles: '至少需要 2 个有效文件。',
    mapView: '合并路线',
    totalDistance: '总距离',
    totalTime: '总时长',
    movingTime: '运动时长',
    avgSpeed: '平均速度',
    maxSpeed: '最高速度',
    elevation: '累计爬升',
    closeMap: '关闭地图',
    back: '返回',
    startOver: '重新开始',
    mergedTrack: '合并路线',
    filesReady: '个文件已就绪',
    previewTitle: '预览合并后的活动',
    previewDescription: '一切看起来不错。确认合并结果后下载新的 FIT 文件。',
    heroTitle: '把多个 FIT 文件合并成一个。',
    heroDescription: '将多个 Garmin、Polar 或 Suunto 的 FIT 文件合并成一个干净的结果文件。',
    howItWorksTitle: '使用方式',
    howItWorksDescription: '从选择到下载，只需要清晰的三步。',
    stepUpload: '选择文件',
    stepReview: '预览',
    stepDownload: '下载',
    compatibilityLabel: '支持 Garmin、Polar、Suunto',
    previewLabel: '下载前预览路线',
    readyToMerge: '可以继续',
    localFirst: '本地处理',
    noFilesYet: '还没有选择文件',
    noFilesDescription: '先选择 FIT 文件，再检查内容并进行合并。',
    noTrackData: '还没有合并预览',
    noTrackDescription: '合并 2 个或更多有效文件后，就可以预览组合路线。',
    invalidFiles: '个无效文件',
    validFiles: '个有效',
    languageLabel: '语言',
    avgPower: '平均功率',
    maxPower: '最大功率',
    mergeReady: '可下载',
    stepOnePill: '第 1 步 / 共 3 步',
    stepTwoPill: '第 2 步 / 共 3 步',
    stepThreePill: '第 3 步 / 共 3 步',
    stepOneTitle: '选择文件',
    stepTwoTitle: '检查你的文件',
    stepThreeTitle: '预览合并后的活动',
    stepOneSubtitle: '从设备中添加一个或多个 FIT 文件。',
    stepTwoSubtitle: '请先确认活动内容正确，我们再进行合并。',
    stepThreeSubtitle: '一切看起来不错。确认合并结果后下载新的 FIT 文件。',
    privacyHeader: '你的文件保持私密',
    learnMore: '了解更多',
    continueToPreview: '继续查看合并预览',
    continueToDownload: '继续下载',
    allGood: '一切正常！',
    allFilesReady: '所有已选文件都有效，可以继续合并。',
    mergedSummary: '合并活动摘要',
    mergedActivities: '合并活动数',
    mergePreviewLooksGreat: '合并预览看起来不错！',
    mergePreviewMessage: '你的活动文件已经成功组合。',
    editSettings: '编辑设置',
    smartMerge: '智能合并（推荐）',
    smartMergeDescription: '自动按时间顺序组合多个活动。',
    sourceFiles: '源文件',
    filesSelected: '个文件已选择',
  },
}

export const useTranslations = (lang: Language) => translations[lang]
