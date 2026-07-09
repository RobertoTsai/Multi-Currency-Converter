# AGENTS.md

本專案是 Chrome Extension Manifest V3 套件：Multi-Currency Converter。請先閱讀本檔，再依需要查看 `GEMINI.md` 指向的 `specs/001-settings-panel/plan.md`。

## 專案邊界

- `Extension/` 是 Chrome 套件發布目錄，只能放置套件執行需要的程式、樣式、設定、圖示與隨包資產。
- 規格、研究、計畫、提示詞、開發筆記與其他非發布文件放在根目錄或 `specs/`，不要放進 `Extension/`。
- 不建立 `dist/`、`build/` 或打包流程，除非使用者明確要求；目前專案以未打包擴充功能直接載入 `Extension/`。

## 技術規則

- 使用 Vanilla HTML/CSS/JavaScript，維持 Manifest V3 相容。
- 不新增框架、bundler、npm 專案或未要求的第三方依賴。既有拖曳排序使用 `Extension/Sortable.min.js`。
- 不新增 Chrome 權限或 host permissions，除非功能必要且先說明理由。
- 不加入遠端執行程式碼或 telemetry。匯率 API 請維持只取公開匯率，不傳送使用者輸入金額或個人資料。

## 主要檔案

- `Extension/manifest.json`: 套件名稱、版本、權限、host permissions、icons 與 web accessible resources。
- `Extension/popup.html`: popup UI 結構。
- `Extension/popup.js`: 主要邏輯，包含匯率抓取、快取、換算、排序、搜尋、設定面板、語系與數字格式。
- `Extension/styles.css`: popup 與設定面板樣式，需維持小尺寸 popup 可用。
- `Extension/currency_config.json`: 法幣與加密貨幣資料、多語系名稱與符號。
- `Extension/background.js`: 目前未在 manifest 註冊；不要假設它會執行，除非同步更新 manifest。

## 實作注意事項

- Popup 預設約 350px x 450px，獨立 popup window 約 380px x 480px；新增 UI 要避免水平溢出與多重捲軸。
- 新增可見文字時，同步更新 `popup.js` 的 `translations`，並在 HTML 使用既有 `data-i18n`、`data-i18n-title` 或 `data-i18n-placeholder` 模式。
- 使用者設定存在 `chrome.storage.sync` 的 `userSettings`；舊的 `userLanguage` 仍需維持相容。
- 使用者幣別排序、最後輸入幣別與金額使用 `chrome.storage.sync`；匯率與貨幣設定快取使用 `chrome.storage.local`。
- 數字解析與格式化需尊重 `currentDecimalSeparator`、`currentThousandsSeparator`，並避免小數點與千分位相同。
- 修改換算或輸入解析時，檢查 `formatCustomNumber`、`parseFormattedNumber`、`evaluateExpression`、`updateAllAmounts`、`convert` 的完整資料流。

## 驗證

- 沒有現成自動化測試或 build 指令。完成修改後，以 Chrome 開發者模式載入 `Extension/` 做人工驗證。
- 最小驗證清單：開啟 popup、更新匯率、增刪貨幣、拖曳排序、輸入四則運算、切換設定面板、切換語言、切換小數點/千分位格式、重開 popup 後設定仍保留。
- 若修改 `manifest.json`，重新載入擴充功能並確認權限、CSP、圖示與 `currency_config.json` 載入正常。
