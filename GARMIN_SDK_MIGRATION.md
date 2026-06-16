# Garmin Official FIT SDK Migration

## 概述 / Overview

本项目已从第三方 FIT 解析库 `fit-file-parser` 迁移到 Garmin 官方的 FIT JavaScript SDK (`@garmin/fitsdk`)。

This project has been migrated from the third-party `fit-file-parser` library to Garmin's official FIT JavaScript SDK (`@garmin/fitsdk`).

## 为什么迁移？/ Why Migrate?

### 官方支持 / Official Support
- **权威性**: Garmin 官方 SDK 遵循 FIT 协议的官方规范
- **准确性**: 更准确地解析和编码 FIT 文件数据
- **维护性**: 由 Garmin 官方维护，及时更新支持新的 FIT 协议版本

### Authority
- **Official**: Garmin's official SDK follows the official FIT protocol specification
- **Accuracy**: More accurate parsing and encoding of FIT file data
- **Maintenance**: Officially maintained by Garmin with timely updates for new FIT protocol versions

## 主要变更 / Key Changes

### 1. 依赖包变更 / Package Changes

**移除 / Removed:**
```bash
npm uninstall fit-file-parser
```

**添加 / Added:**
```bash
npm install @garmin/fitsdk
```

### 2. 数据结构变更 / Data Structure Changes

**旧结构 / Old Structure (fit-file-parser):**
```javascript
{
  records: [...],
  sessions: [{
    total_distance: 42800,
    total_elapsed_time: 4803,
    total_ascent: 143
  }],
  laps: [...]
}
```

**新结构 / New Structure (@garmin/fitsdk):**
```javascript
{
  messages: {
    recordMesgs: [...],
    sessionMesgs: [{
      totalDistance: 42800000,  // 单位变为米 / in meters
      totalElapsedTime: 4803,
      totalAscent: 143
    }],
    lapMesgs: [...],
    fileIdMesgs: [...]
  }
}
```

### 3. 字段名变更 / Field Name Changes

| 旧字段名 / Old Field | 新字段名 / New Field | 说明 / Note |
|---------------------|---------------------|------------|
| `total_distance` | `totalDistance` | 驼峰命名 / camelCase |
| `total_elapsed_time` | `totalElapsedTime` | 驼峰命名 / camelCase |
| `total_ascent` | `totalAscent` | 驼峰命名 / camelCase |
| `position_lat` | `positionLat` | 驼峰命名 / camelCase |
| `position_long` | `positionLong` | 驼峰命名 / camelCase |
| `enhanced_altitude` | `enhancedAltitude` | 驼峰命名 / camelCase |

### 4. API 使用变更 / API Usage Changes

**解析文件 / File Parsing:**

```javascript
// 旧方式 / Old Way
import FitParser from 'fit-file-parser'
const fitParser = new FitParser()
fitParser.parse(buffer, (error, data) => {
  // ...
})

// 新方式 / New Way
import { Decoder, Stream } from '@garmin/fitsdk'
const stream = Stream.fromArrayBuffer(arrayBuffer)
const decoder = new Decoder(stream)
if (decoder.isFIT() && decoder.checkIntegrity()) {
  const { messages, errors } = decoder.read()
  // ...
}
```

**编码文件 / File Encoding:**

```javascript
// 旧方式 / Old Way
// 手动构建二进制数据，容易出错
// Manually building binary data, error-prone

// 新方式 / New Way
import { Encoder } from '@garmin/fitsdk'
const encoder = new Encoder()
encoder.writeMesg(fileIdMessage)
encoder.writeMesg(recordMessage)
encoder.writeMesg(sessionMessage)
const fitData = encoder.close()
```

## 影响的文件 / Affected Files

1. **`src/lib/fitParser.ts`** - FIT 文件解析逻辑 / FIT file parsing logic
2. **`src/lib/fitMerger.ts`** - FIT 文件合并逻辑 / FIT file merging logic
3. **`src/components/TrackMap.tsx`** - 地图组件数据访问 / Map component data access
4. **`PRD.md`** - 项目文档更新 / Project documentation update

## 累计爬升修复 / Total Ascent Fix

之前累计爬升数据不准确的原因 / Previous inaccurate total ascent was caused by:

1. **字段读取错误**: 之前使用的 `fit-file-parser` 可能没有正确解析 `total_ascent` 字段
2. **合并逻辑问题**: 合并时没有正确累加各个文件的累计爬升数据

**Field Reading Error**: The previous `fit-file-parser` may not have correctly parsed the `total_ascent` field
**Merge Logic Issue**: The merge process did not correctly accumulate total ascent from each file

现在的修复 / Current Fix:

```javascript
// 正确读取 totalAscent
if (session.totalAscent !== undefined && session.totalAscent !== null) {
  metadata.totalAscent = session.totalAscent
}

// 合并时正确累加
validFiles.forEach((fileData) => {
  const messages = fileData.parsed.messages
  if (messages.sessionMesgs && messages.sessionMesgs.length > 0) {
    const session = messages.sessionMesgs[0]
    if (session.totalAscent !== undefined && session.totalAscent !== null) {
      totalAscent += session.totalAscent  // 累加每个文件的值
    }
  }
})
```

## 测试建议 / Testing Recommendations

1. **上传测试文件** / Upload test files
   - 使用原始的 FIT 文件进行测试
   - Test with original FIT files

2. **验证元数据** / Verify metadata
   - 检查距离、时间、累计爬升等数据是否准确
   - Check if distance, time, total ascent data are accurate

3. **测试合并功能** / Test merge functionality
   - 合并多个文件并验证结果
   - Merge multiple files and verify results

4. **上传到平台** / Upload to platforms
   - 将合并后的文件上传到 Strava、Garmin Connect 等平台验证
   - Upload merged files to Strava, Garmin Connect to verify

## 优势 / Benefits

1. **更高的准确性**: 官方 SDK 保证数据解析的准确性
2. **更好的兼容性**: 与 Garmin 设备和平台完全兼容
3. **类型安全**: TypeScript 类型定义完善
4. **持续更新**: 官方维护，支持最新的 FIT 协议特性

1. **Higher Accuracy**: Official SDK ensures data parsing accuracy
2. **Better Compatibility**: Fully compatible with Garmin devices and platforms
3. **Type Safety**: Complete TypeScript type definitions
4. **Continuous Updates**: Officially maintained with support for latest FIT protocol features

## 参考资料 / References

- [Garmin FIT SDK GitHub](https://github.com/garmin/fit-javascript-sdk)
- [FIT Protocol Documentation](https://developer.garmin.com/fit/overview/)
- [NPM Package: @garmin/fitsdk](https://www.npmjs.com/package/@garmin/fitsdk)
