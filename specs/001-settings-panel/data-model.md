# 資料模型定義 (Data Model Specification)

**功能分支**: `001-settings-panel`

本文件定義了「設定面板」功能所使用的儲存資料模型與配置形狀。

---

## 1. 使用者設定實體 (UserSettings Entity)

所有的設定皆以單一鍵值 `userSettings` 儲存於 `chrome.storage.sync` 中，其結構為 JSON 對象。為了向後相容性，也需讀取既有的 `userLanguage` 儲存鍵作為 Fallback。

### 屬性定義 (Attributes)

| 屬性名稱 (Property) | 資料型態 (Type) | 必填 (Required) | 預設值 (Default) | 描述 / 可選值 (Description & Constraints) |
| :--- | :--- | :---: | :--- | :--- |
| `decimalSeparator` | `string` | 是 | `"."` | 小數點分隔符。可選值：<br>- `"."` (點)<br>- `","` (逗號) |
| `thousandsSeparator` | `string` | 是 | `","` | 千分位分隔符。可選值：<br>- `""` (無)<br>- `" "` (空格)<br>- `"."` (點)<br>- `","` (逗號) |
| `userLanguage` | `string` | 否 | `""` | 使用者選取的介面語言。為空字串時代表「未設定」，此時將自動以既有的瀏覽器語言偵測邏輯為準。可選值：<br>- `""` (未指定，自動)<br>- `"en"` (English)<br>- `"zh-TW"` (繁體中文)<br>- `"zh-CN"` (簡體中文)<br>- 專案支援的其他語系代碼 |

---

## 2. 驗證規則與約束 (Validation Rules)

1.  **防衝突約束 (Conflict Prevention)**:
    `decimalSeparator` 與 `thousandsSeparator` 的值不得相同。如果偵測到相同，驗證邏輯必須拒絕寫入或自動修正。
2.  **型態安全 (Type Safety)**:
    如果讀取到的 `userSettings` 不是 JSON 物件，或者屬性包含不合法的字元或非預期字串，必須將對應欄位還原為預設值。

---

## 3. 相容性與遷移策略 (Backward Compatibility & Migration)

由於此專案為既有的棕地專案，必須處理以下相容性場景：

1.  **情境 A: 全新安裝或升級後首次使用**
    -   `chrome.storage.sync.get('userSettings')` 回傳為空。
    -   系統應初始化 `userSettings` 為：
        ```json
        {
          "decimalSeparator": ".",
          "thousandsSeparator": ",",
          "userLanguage": ""
        }
        ```
    -   此時語言判定將 fallback 至既有的 `getUserLanguage()` 邏輯（讀取獨立的 `userLanguage` 鍵，若無則讀取瀏覽器語系）。

2.  **情境 B: 既有使用者已在舊版本設定過獨立的 `userLanguage`**
    -   升級後，若 `userSettings.userLanguage` 為空，系統應嘗試讀取舊的 `chrome.storage.sync.get('userLanguage')`。
    -   如果存在舊的語言設定，系統應將其同步寫入新的 `userSettings.userLanguage` 中，實現無縫遷移。

3.  **情境 C: 異常資料恢復**
    -   若 Chrome storage 讀取失敗或受損，記憶體中的執行變數（`currentDecimalSeparator`, `currentThousandsSeparator`）應維持預設值，不影響 popup 正常使用。
