# 儲存與介面合約 (Storage & Interface Contracts)

**功能分支**: `001-settings-panel`

本文件定義了設定面板功能在資料儲存（Chrome Storage）及跨模組調用上的資料格式合約。

---

## 1. Chrome Storage API 序列化合約

### 1.1 設定資料儲存合約 (UserSettings Contract)

-   **儲存類型 (Storage Type)**: `chrome.storage.sync`
-   **儲存鍵值 (Storage Key)**: `userSettings`
-   **Payload 結構**:

```json
{
  "userSettings": {
    "decimalSeparator": ".",
    "thousandsSeparator": ",",
    "userLanguage": "zh-TW"
  }
}
```

#### 欄位約束與行為說明

*   `decimalSeparator` (必填):
    *   型態: `string`
    *   長度: 1
    *   有效值: `.` 或 `,`
*   `thousandsSeparator` (必填):
    *   型態: `string`
    *   長度: 0 或 1
    *   有效值: `""` (無)、`" "` (空格)、`.`、`,`
*   `userLanguage` (選填):
    *   型態: `string`
    *   有效值: `""` (未指定) 或專案所支援的 ISO 639-1 語系代碼（如 `"en"`, `"zh-TW"`, `"zh-CN"`, `"es"`, `"ja"` 等）。

---

## 2. 舊版獨立 Key 向後相容合約 (Fallback Key Contract)

為了與舊版擴充功能相容，系統將讀取並寫入以下舊版獨立 Key 作為備用或遷移源：

-   **儲存鍵值**: `userLanguage` (string)
-   **型態**: `string`
-   **合約邏輯**:
    *   當 `userSettings.userLanguage` 存在且非空時，優先使用 `userSettings.userLanguage`。
    *   當且僅當 `userSettings.userLanguage` 為空或未定義時，讀取 `userLanguage` 的值。

---

## 3. 輸入解析與格式化 API 內部合約

內部 JS 函數的輸入與輸出合約如下：

### 3.1 數字格式化函數 (formatCustomNumber)

```typescript
function formatCustomNumber(
  value: number, 
  decimalSep: string, 
  thousandsSep: string
): string
```

-   **輸入**:
    *   `value`: 有效的 JavaScript 浮點數或整數 (e.g. `12345.67`)。
    *   `decimalSep`: 當前設定的小數點字元。
    *   `thousandsSep`: 當前設定的千分位字元。
-   **輸出**: 格式化後的字串 (e.g. `"12,345.67"` 或 `"12.345,67"`)。

### 3.2 輸入解析函數 (parseCustomFormattedNumber)

```typescript
function parseCustomFormattedNumber(
  str: string, 
  decimalSep: string, 
  thousandsSep: string
): number
```

-   **輸入**:
    *   `str`: 使用者輸入的金額字串，可能包含自訂小數點與千分位字元 (e.g. `"12.345,67"` 或算式 `"100+50,5"`。
    *   `decimalSep`: 當前設定的小數點字元。
    *   `thousandsSep`: 當前設定的千分位字元。
-   **輸出**: 可被 JavaScript 解析的浮點數，或 `NaN`（若無法解析）。
-   **解析邏輯**:
    1.  如果千分位分隔符 `thousandsSep` 非空，則移除非當前小數點的所有千分位符號。
    2.  將 `decimalSep` 替換為 `.`。
    3.  使用 `parseFloat` 或算式運算引擎進行解析。
