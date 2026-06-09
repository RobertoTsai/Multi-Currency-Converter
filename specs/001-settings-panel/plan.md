# 技術實作計畫：設定面板 (Settings Panel)

**分支**: `001-settings-panel` | **日期**: 2026-06-09 | **規格書**: [spec.md](./spec.md)

**輸入**: `/specs/001-settings-panel/spec.md` 的功能規格書

## 摘要

本計畫旨在現有的 Chrome 擴充功能「Multi-Currency Converter Extension」中新增「設定」按鈕與「設定面板」畫面。使用者可在此面板中自訂小數點與千分位格式，並設定介面語言。實作將完全基於 Vanilla HTML/JS/CSS，在既有的 `Extension/` 目錄下進行擴展，保持 Manifest V3 相容性，並且不引入任何第三方框架，以達到棕地開發的穩定性優先原則。

## 技術背景 (Technical Context)

*   **程式語言/版本**: HTML5, Vanilla JavaScript (ES6+), CSS3. Chrome Extension Manifest V3.
*   **主要依賴 (Dependencies)**: `Sortable.min.js` (既有，用於拖曳排序)。本功能**無**新增任何第三方依賴。
*   **儲存方式 (Storage)**: `chrome.storage.sync`（主要，用於跨裝置同步設定值），若同步失敗，將安全 fallback 至 `chrome.storage.local`。
*   **測試方法 (Testing)**: 以 Chrome 開發者模式載入未打包擴充功能（Unpacked Extension），進行功能與 UI 之人工驗證。
*   **目標平台**: 支援 Manifest V3 的 Chrome/Chromium 核心瀏覽器。
*   **專案類型**: 瀏覽器擴充功能 (Chrome Extension)。
*   **效能目標**: 格式切換即時反應，預覽區及主要畫面金額渲染時間應小於 50 毫秒。
*   **系統約束 (Constraints)**: 
    *   維持 popup 尺寸限制（380px 寬度，最大 600px 高度），不得有溢出或多重滾動條。
    *   必須確保主畫面的編輯狀態（Focus/Input）與非編輯狀態（Blur）在不同格式下正常切換。
    *   計算引擎（`evaluateExpression`）的運算必須維持標準 JavaScript 數值。
*   **規模範疇**: 1 個設定切換面板、3 個儲存屬性（小數點、千分位、語言），支援 3 種主要語系（英文、繁中、簡中）的擴充。

## 憲法遵循檢查 (Constitution Check)

*   門檻 1 (功能門檻)：保留既有貨幣換算、排序與彈出視窗行為。 (通過)
*   門檻 2 (在地化門檻)：新增文字皆有 translations 機制支援，不寫死單一語言。 (通過)
*   門檻 3 (文件語言門檻)：本技術計畫及相依文件均使用繁體中文 zh-TW 撰寫。 (通過)
*   門檻 4 (安全性門檻)：不請求額外權限，不引入遠端執行程式碼。 (通過)
*   門檻 5 (隱私門檻)：不傳送使用者金額或個人隱私，不使用追蹤遙測。 (通過)
*   門檻 6 (效能門檻)：利用快取與本地事件處理，UI 渲染快速無阻塞。 (通過)
*   門檻 7 (棕地相容性門檻)：維持既有儲存結構相容。 (通過)
*   **門檻 8 (發佈邊界門檻)**：所有擴充功能執行程式碼皆位於 `Extension/` 目錄內。 (通過)
*   門檻 9 (驗證門檻)：採用完整人工驗證清單，覆蓋線上與離線狀態。 (通期)

*審查結論*：無憲法違規情事。

## 專案目錄結構 (Project Structure)

### 說明文件與規格 (specs/001-settings-panel)

```text
specs/001-settings-panel/
├── spec.md              # 功能規格書
├── plan.md              # 本技術實作計畫書 (本檔案)
├── research.md          # 關鍵技術方案與評估
├── data-model.md        # 資料模型定義
└── quickstart.md        # 快速開始與人工驗證指南
```

### 原始碼結構 (Extension)

所有對擴充功能的實際修改皆位於 `Extension/` 發佈邊界內：

```text
Extension/
├── manifest.json        # 擴充功能設定檔 (無須修改權限)
├── popup.html           # 新增設定按鈕與設定面板 HTML 結構
├── styles.css           # 新增設定按鈕與設定面板的視覺樣式
├── popup.js             # 實作設定面板控制、數字格式化、輸入解析與語言切換邏輯
├── background.js        # 既有背景服務
├── currency_config.json # 既有貨幣配置
└── Sortable.min.js      # 既有拖曳排序庫
```

**結構決定**: 所有的開發工作嚴格限定在既有 `Extension/` 中，以確保發佈邊界清晰，不會將開發/規格文件打包進擴充功能。

## 複雜度追蹤 (Complexity Tracking)

> *無憲法門檻違規，此處留空。*
