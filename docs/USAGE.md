# BoyFriend Photo Savior — 使用指南

BoyFriend Photo Savior 是一個 **Reference / Template → 構圖導引 → Camera** 的拍照 POC，支援 Web、iOS、Android。

核心概念只有兩個：

```text
Template / Reference = 想拍成什麼
Display Mode         = 要用什麼方式顯示導引
```

四種 Display Mode：

| Mode | 適合情境 | 畫面上會看到 |
| --- | --- | --- |
| **Outline** | 最直覺的人像對位 | 人物外輪廓，讓真人直接「站進去」 |
| **Skeleton** | 想精準模仿姿勢 | 頭、肩、手臂、髖、腿等骨架與關節 |
| **Ghost** | 快速重疊姿勢 | 半透明填滿的人形 stencil |
| **Guide** | 構圖、餐點、場景 | subject zone、eye line、look space、物件位置、引導線、框線等 |

> Live Coach 是額外的拍攝協助，不是第五種 Display Mode。

---

## 1. 啟動 App

建議使用 Node 22.13+。

```bash
npm install
npm run spec:validate
npm run typecheck
npm run web
```

也可以：

```bash
npx expo start
```

然後：

- `w`：Web
- `i`：iOS simulator
- `a`：Android emulator

相機功能建議最後仍用實體手機測試。

### Web 注意事項

- `localhost` 可以直接測相機。
- 部署到其他網域時，相機通常需要 HTTPS / secure context。
- 第一次做人像分析時需要網路下載 MediaPipe runtime / models。

---

# 2. 用自己的照片當 Reference

目前自動分析最適合 **單一人物的人像照片**。

### Step 1 — 選照片

首頁按：

**`Use my reference photo`**

建議照片：

- 一張照片只有一位主要人物
- 人不要小到只佔畫面一小角
- 身體姿勢需要模仿時，手腳盡量不要被裁掉
- 輪廓與背景最好有一定區隔

### Step 2 — 等待分析

系統會依序取得：

```text
人物 segmentation → 外輪廓
Pose Landmarker    → 身體 anchor
Face Landmarker    → 臉朝向
                 ↓
            Shared GuideSpec
```

成功後會看到：

**`Shared geometry ready`**

如果部分模型辨識不到，系統會盡量保留仍可使用的導引；如果整體分析失敗，畫面仍會保留可手動調整的 fallback guide。

### Step 3 — 選導引方式

同一張照片不需要重新跑 AI，可以直接切：

**`Outline / Skeleton / Ghost / Guide`**

建議：

- 一般旅行人像：先用 **Outline**
- 想模仿手腳姿勢：用 **Skeleton**
- 只想快速重疊人物位置：用 **Ghost**
- 更重視畫面留白、視線與構圖：用 **Guide**

### Step 4 — 是否顯示 Reference 原圖

右上角可以切：

- **`Guide only`**：只看導引
- **`Show photo`**：Reference + Guide 一起看

實際拍攝時通常建議先確認原圖，再切到 Guide only。

### Step 5 — 微調 Guide

可以使用：

- `← ↑ ↓ →`：移動 Guide
- `− / +`：縮小 / 放大
- `Reset`：恢復原始位置

這些調整會改變真正的 target geometry，所以 Live Coach 會依你調整後的位置來判斷。

### Step 6 — 開相機

按：

**`Open camera`**

第一次使用會要求 Camera permission。

---

# 3. 使用內建 Template

如果不想先找 Reference，可以直接從首頁的 **Template library** 選。

流程：

```text
Display Mode
   ↓
Category
   ↓
Template
   ↓
Preview / 微調
   ↓
Open camera
```

## Template Mode

首頁先選：

- Outline
- Skeleton
- Ghost
- Guide

大型模板庫會再顯示 Category，避免一次載入幾十個 preview。

### Ghost

目前有 62-slot PoseGhost-inspired POC library，例如：

- Selfie Essentials
- Female Poses
- Male Poses
- Couple Poses
- Wedding Poses
- Friends & Groups

這 62 個是目前依公開分類與 pose family 重建的 POC geometry，不代表 PoseGhost 官方逐張排序的 1:1 複製。

### Guide

適合：

- Portrait
- Food
- Travel
- Street
- Selfie
- Pets
- Family
- Landscape
- Buildings
- Basic composition

例如食物可用：

- Plate + Glass
- 單一主體
- 雙物件關係
- 三物件 triangle
- flat lay / off-center 類構圖

---

# 4. Camera 畫面怎麼看

## 單人 Portrait

單人 portrait 會啟用 **Live Coach · Sampled**。

目前不是 30 FPS 即時分析，而是大約每 1–2 秒取一張低品質分析 frame。

上方可能看到：

```text
POS  82
SIZE 91
POSE 76
FACE 100
```

含義：

- **POS**：人物在畫面中的位置
- **SIZE**：人物大小 / 取景比例
- **POSE**：身體姿勢
- **FACE**：臉朝向（有需要時才顯示）

主要畫面一次只給一個最重要的動作，例如：

- `Subject → left`
- `Subject ↑`
- `Move closer`
- `Step back`
- `Face → right`
- `Raise left wrist`
- `Show the full pose`

## HOLD → STABLE

一張分析 frame 對到並不會立刻變綠。

目前規則：

```text
第一次 matched
→ HOLD 1/2

第二次連續 matched
→ STABLE
```

進入 STABLE 後：

- 一次輕微失準：仍保留 Stable
- 連續兩次輕微失準：解除 Stable
- 人物位置 / 大小明顯跑掉：立即解除 Stable

這是為了避免 segmentation / pose 小幅抖動造成綠燈不停閃爍。

---

# 5. Auto Capture

Auto Capture 目前只支援 **單人 Portrait + Live Coach**。

每次進 Camera 時預設：

**`AUTO OFF`**

如果要使用：

1. 確認 `AI On`
2. 按 `AUTO OFF` 切成 **`AUTO ON`**
3. 系統會重新開始累積 Stable Match
4. 連續兩次 matched → Stable
5. 第一次進入 Stable 時自動拍一張

```text
AUTO ON
   ↓
MATCH 1/2
   ↓
STABLE 2/2
   ↓
Auto Capture × 1
```

只要一直維持同一次 Stable，不會重複連拍。

要再自動拍下一張，需要：

```text
失去 Stable
   ↓
重新對準
   ↓
再次進入 Stable
   ↓
Auto Capture × 1
```

### Manual shutter

即使 AUTO ON，中央實體 shutter 按鈕仍可隨時手動拍。

Sampled analysis、Manual Capture、Auto Capture 會共用 capture lock，不會刻意同時呼叫兩次 camera capture。

---

# 6. 雙人 / 多人怎麼用

目前雙人、情侶、朋友、群體 Template **可以正常顯示 Overlay**，但 Live Coach 還不支援多人物 matching。

進相機後會顯示類似：

**`MANUAL GUIDE`**

這時請直接使用：

- Outline
- Skeleton
- Ghost
- Guide

肉眼把多人關係對進去。

目前不會讓多人 Template 進入 Stable Match，也不會觸發 Auto Capture。

這是刻意的安全限制；等未來 multi-person detection / assignment 完成後再開啟多人 matching。

---

# 7. Food / Scene 怎麼用

Food / Scene 目前主要使用 **Guide Mode**，不跑人物 Live Coach。

例如：

```text
       ○ GLASS

  ◯ PLATE     ◯ DESSERT
```

或：

```text
──────── LOW HORIZON

       SUBJECT ZONE
```

你需要自己依照：

- 物件大小
- 物件間距
- 前後關係
- 線條
- zone
- horizon
- frame

在相機裡完成構圖。

目前沒有 Food / Scene Auto Capture。

---

# 8. 拍好的照片現在存在哪？

這點目前很重要：

> **MVP 現在只顯示 Captured thumbnail，還沒有正式做「儲存到 Photos / Gallery」功能。**

在 iOS / Android，Expo Camera 的目前 capture URI 是 app cache 裡的暫存檔；不要把它當作永久相簿檔案。

因此目前：

- Camera 畫面會看到 `Captured` / `Auto captured`
- 關閉 app / cache 被清理後，不保證照片還存在
- 還沒有 Save / Share / Export workflow

在正式拿它當相機 App 前，**Save to Photos / Share 是下一個必補功能之一**。

---

# 9. 常見問題

## 一直顯示 `SCANNING…`

確認：

- 畫面中只有一位主要人物
- 人物不要太小
- 光線足夠
- 第一次 MediaPipe model 已載入完成

Live Coach 是 sampled，不會每個 frame 都立刻更新；可以等約 1–2 秒。

## 顯示 `Show the full pose`

Reference 有明顯手腳 pose，但當前相機看不到足夠 body landmarks。

嘗試：

- 往後退
- 讓肩膀 / 手臂 / 腿更多進入畫面
- 避免手腳完全被物件遮住

系統不會在 pose signal 缺失時偷偷改成只看 framing 然後判定 Stable。

## 雙人 Template 沒有分數

正常。

目前雙人 / 多人是 **Manual Guide only**，還沒有 multi-person Live Coach。

## AUTO 不會拍

確認：

1. 是單人 Portrait
2. `AI On`
3. `AUTO ON`
4. 已重新累積到 `HOLD 1/2 → STABLE`
5. Camera 沒有顯示 error

如果已經在同一次 Stable 期間自動拍過一次，不會再重複拍；要先失去 Stable 再重新進入。

## Camera 顯示 unavailable / error

可能原因：

- Camera permission 被拒絕
- browser / device camera 被其他程式占用
- CameraView mount 失敗

重新確認權限或重開 Camera screen。

## Reference 分析失敗

可換一張：

- 輪廓更清楚
- 主體更大
- 背景較不複雜
- 一人為主

分析失敗時仍可使用 fallback Guide 做手動構圖。

---

# 10. Privacy / Network

目前設計是 local-first：

- Reference photo 與 sampled camera image bytes 不送到我們自己的 cloud backend
- segmentation / pose / face 分析在裝置端的 MediaPipe runtime 執行
- MediaPipe WASM / model 檔目前會從公開 URL 載入，所以第一次使用需要網路

目前沒有帳號、server-side photo storage 或 cloud photo analysis。

---

# 11. 目前 MVP 邊界

現在已完成：

- Reference → one-person geometry
- Outline / Skeleton / Ghost / Guide
- Template library + category filtering + virtualization
- sampled single-person Live Coach
- Stable Match
- opt-in Auto Capture
- Camera capture thumbnail

目前尚未完成：

- 真正 15–30 FPS frame processor
- arbitrary multi-person reference extraction / matching
- arbitrary food / object / scene photo understanding
- Save to Photos / Gallery
- Share / Export
- 完整 offline model bundle
- 完整自動化 unit / integration tests
- iOS / Android 實機 smoke test 紀錄

---

## 最推薦的 MVP 使用方式

現在最值得先測的是：

```text
單人 Reference
   ↓
Outline
   ↓
微調位置 / 大小
   ↓
Open camera
   ↓
Live Coach
   ↓
HOLD → STABLE
   ↓
手動拍 / AUTO ON
```

第二條則是：

```text
Food / Travel / Couple Template
   ↓
選適合的 Display Mode
   ↓
直接依 Overlay 手動構圖
```

先用這兩條流程驗證「導引本身是否真的讓拍照變簡單」，再決定是否值得投入真正高 FPS camera frame processor。
