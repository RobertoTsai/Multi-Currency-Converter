const currencyList = document.getElementById('currency-list');
const popupWindowButton = document.getElementById('popup-window');
const addCurrencyButton = document.getElementById('add-currency');
const currencyModal = document.getElementById('currency-modal');
const currencySearch = document.getElementById('currency-search');
const allCurrenciesList = document.getElementById('all-currencies');
const closeModalButton = document.getElementById('close-modal');
const openSettingsButton = document.getElementById('open-settings');
const backButton = document.getElementById('back-button');
const mainView = document.getElementById('main-view');
const settingsView = document.getElementById('settings-view');

const defaultCurrencies = ['USD', 'EUR', 'JPY', 'TWD', 'BTC', 'ETH'];
const CACHE_DURATION = 15 * 60 * 1000; // 15分鐘的毫秒數
const CURRENCY_INFO_CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7天的毫秒數
let currentLanguage = 'en'; 
let currentDecimalSeparator = '.';
let currentThousandsSeparator = ',';
let currentDecimalPlaces = 2;
let allCurrencies = {};
let lastEditedCurrency = 'USD';
let lastEditedAmount = 100;
let isPopupWindow = false;
let currencyConfig = null;
let currentSearchTerm = '';
let cryptoCurrencies = {};
let fiatRates = {};  // 儲存法幣對 USD 的匯率
let cryptoRates = {};  // 儲存加密貨幣對 BTC 的匯率
let btcToUsd = 0;  // 儲存 BTC 對 USD 的匯率

//多語系文本對象
const translations = {
    'en': {
        'confirmDelete': 'Delete Currency',
        'confirmDeleteMessage': 'Are you sure you want to delete {0} ({1})?',
        'cancel': 'Cancel',
        'confirm': 'Delete',
        'settings': 'Settings',
        'back': 'Back',
        'decimalSeparatorLabel': 'Decimal Separator',
        'thousandsSeparatorLabel': 'Thousands Separator',
        'decimalPlacesLabel': 'Decimal Places',
        'languageLabel': 'Language',
        'previewLabel': 'Format Preview:',
        'none': 'None',
        'space': 'Space',
        'delete': 'Delete',
        'popupWindow': 'Popup window',
        'searchPlaceholder': 'Search currency...',
        'noResults': 'No matching results',
        'dotLabel': 'Dot',
        'commaLabel': 'Comma'
    },
    'zh-TW': {
        'confirmDelete': '確認刪除',
        'confirmDeleteMessage': '確定要刪除 {0} ({1}) 嗎？',
        'cancel': '取消',
        'confirm': '刪除',
        'settings': '設定',
        'back': '返回',
        'decimalSeparatorLabel': '小數點格式',
        'thousandsSeparatorLabel': '千分位設定',
        'decimalPlacesLabel': '小數位數',
        'languageLabel': '語言設定',
        'previewLabel': '格式預覽:',
        'none': '無',
        'space': '空格',
        'delete': '刪除',
        'popupWindow': '彈出視窗',
        'searchPlaceholder': '搜尋貨幣...',
        'noResults': '沒有找到相符的貨幣',
        'dotLabel': '點',
        'commaLabel': '逗號'
    },
    'zh-CN': {
        'confirmDelete': '确认删除',
        'confirmDeleteMessage': '确定要删除 {0} ({1}) 吗？',
        'cancel': '取消',
        'confirm': '删除',
        'settings': '设置',
        'back': '返回',
        'decimalSeparatorLabel': '小数点格式',
        'thousandsSeparatorLabel': '千分位设置',
        'decimalPlacesLabel': '小数位数',
        'languageLabel': '语言设置',
        'previewLabel': '格式预览:',
        'none': '无',
        'space': '空格',
        'delete': '删除',
        'popupWindow': '弹出窗口',
        'searchPlaceholder': '搜索货币...',
        'noResults': '没有找到相符的货币',
        'dotLabel': '点',
        'commaLabel': '逗号'
    },
    'es': {
        'confirmDelete': 'Eliminar Moneda',
        'confirmDeleteMessage': '¿Estás seguro de que quieres eliminar {0} ({1})?',
        'cancel': 'Cancelar',
        'confirm': 'Eliminar'
    },
    'ar': {
        'confirmDelete': 'حذف العملة',
        'confirmDeleteMessage': 'هل أنت متأكد أنك تريد حذف {0} ({1})؟',
        'cancel': 'إلغاء',
        'confirm': 'حذف'
    },
    'hi': {
        'confirmDelete': 'मुद्रा हटाएं',
        'confirmDeleteMessage': 'क्या आप वाकई {0} ({1}) को हटाना चाहते हैं?',
        'cancel': 'रद्द करें',
        'confirm': 'हटाएं'
    },
    'pt': {
        'confirmDelete': 'Excluir Moeda',
        'confirmDeleteMessage': 'Tem certeza de que deseja excluir {0} ({1})?',
        'cancel': 'Cancelar',
        'confirm': 'Excluir'
    },
    'bn': {
        'confirmDelete': 'মুদ্রা মুছুন',
        'confirmDeleteMessage': 'আপনি কি নিশ্চিত যে আপনি {0} ({1}) মুছতে চান?',
        'cancel': 'বাতিল',
        'confirm': 'মুছুন'
    },
    'ru': {
        'confirmDelete': 'Удалить валюту',
        'confirmDeleteMessage': 'Вы уверены, что хотите удалить {0} ({1})?',
        'cancel': 'Отмена',
        'confirm': 'Удалить'
    },
    'ja': {
        'confirmDelete': '通貨を削除',
        'confirmDeleteMessage': '{0} ({1}) を削除してもよろしいですか？',
        'cancel': 'キャンセル',
        'confirm': '削除'
    },
    'de': {
        'confirmDelete': 'Währung löschen',
        'confirmDeleteMessage': 'Sind Sie sicher, dass Sie {0} ({1}) löschen möchten?',
        'cancel': 'Abbrechen',
        'confirm': 'Löschen'
    },
    'fr': {
        'confirmDelete': 'Supprimer la devise',
        'confirmDeleteMessage': 'Êtes-vous sûr de vouloir supprimer {0} ({1}) ?',
        'cancel': 'Annuler',
        'confirm': 'Supprimer'
    }
};

const languageLabels = {
    'en': 'English',
    'zh-TW': '繁體中文',
    'zh-CN': '简体中文',
    'es': 'Español',
    'ar': 'العربية',
    'hi': 'हिन्दी',
    'pt': 'Português',
    'bn': 'বাংলা',
    'ru': 'Русский',
    'ja': '日本語',
    'de': 'Deutsch',
    'fr': 'Français',
    'ko': '한국어'
};

const settingsTranslations = {
    'es': {
        'settings': 'Configuración',
        'back': 'Atrás',
        'decimalSeparatorLabel': 'Separador decimal',
        'thousandsSeparatorLabel': 'Separador de miles',
        'decimalPlacesLabel': 'Decimales',
        'languageLabel': 'Idioma',
        'previewLabel': 'Vista previa:',
        'none': 'Ninguno',
        'space': 'Espacio',
        'delete': 'Eliminar',
        'popupWindow': 'Ventana emergente',
        'searchPlaceholder': 'Buscar moneda...',
        'noResults': 'No hay resultados',
        'dotLabel': 'Punto',
        'commaLabel': 'Coma'
    },
    'ar': {
        'settings': 'الإعدادات',
        'back': 'رجوع',
        'decimalSeparatorLabel': 'فاصل الأرقام العشرية',
        'thousandsSeparatorLabel': 'فاصل الآلاف',
        'decimalPlacesLabel': 'عدد المنازل العشرية',
        'languageLabel': 'اللغة',
        'previewLabel': 'معاينة التنسيق:',
        'none': 'بدون',
        'space': 'مسافة',
        'delete': 'حذف',
        'popupWindow': 'نافذة منبثقة',
        'searchPlaceholder': 'ابحث عن عملة...',
        'noResults': 'لا توجد نتائج مطابقة',
        'dotLabel': 'نقطة',
        'commaLabel': 'فاصلة'
    },
    'hi': {
        'settings': 'सेटिंग्स',
        'back': 'वापस',
        'decimalSeparatorLabel': 'दशमलव विभाजक',
        'thousandsSeparatorLabel': 'हज़ार विभाजक',
        'decimalPlacesLabel': 'दशमलव स्थान',
        'languageLabel': 'भाषा',
        'previewLabel': 'फ़ॉर्मेट पूर्वावलोकन:',
        'none': 'कोई नहीं',
        'space': 'स्पेस',
        'delete': 'हटाएं',
        'popupWindow': 'पॉपअप विंडो',
        'searchPlaceholder': 'मुद्रा खोजें...',
        'noResults': 'कोई मिलान परिणाम नहीं',
        'dotLabel': 'डॉट',
        'commaLabel': 'कॉमा'
    },
    'pt': {
        'settings': 'Configurações',
        'back': 'Voltar',
        'decimalSeparatorLabel': 'Separador decimal',
        'thousandsSeparatorLabel': 'Separador de milhares',
        'decimalPlacesLabel': 'Casas decimais',
        'languageLabel': 'Idioma',
        'previewLabel': 'Prévia do formato:',
        'none': 'Nenhum',
        'space': 'Espaço',
        'delete': 'Excluir',
        'popupWindow': 'Janela pop-up',
        'searchPlaceholder': 'Buscar moeda...',
        'noResults': 'Nenhum resultado encontrado',
        'dotLabel': 'Ponto',
        'commaLabel': 'Vírgula'
    },
    'bn': {
        'settings': 'সেটিংস',
        'back': 'ফিরে যান',
        'decimalSeparatorLabel': 'দশমিক বিভাজক',
        'thousandsSeparatorLabel': 'হাজার বিভাজক',
        'decimalPlacesLabel': 'দশমিক স্থান',
        'languageLabel': 'ভাষা',
        'previewLabel': 'ফরম্যাট প্রিভিউ:',
        'none': 'কোনোটিই নয়',
        'space': 'স্পেস',
        'delete': 'মুছুন',
        'popupWindow': 'পপআপ উইন্ডো',
        'searchPlaceholder': 'মুদ্রা খুঁজুন...',
        'noResults': 'কোনো মিল পাওয়া যায়নি',
        'dotLabel': 'ডট',
        'commaLabel': 'কমা'
    },
    'ru': {
        'settings': 'Настройки',
        'back': 'Назад',
        'decimalSeparatorLabel': 'Десятичный разделитель',
        'thousandsSeparatorLabel': 'Разделитель тысяч',
        'decimalPlacesLabel': 'Десятичные знаки',
        'languageLabel': 'Язык',
        'previewLabel': 'Предпросмотр формата:',
        'none': 'Нет',
        'space': 'Пробел',
        'delete': 'Удалить',
        'popupWindow': 'Всплывающее окно',
        'searchPlaceholder': 'Поиск валюты...',
        'noResults': 'Нет совпадений',
        'dotLabel': 'Точка',
        'commaLabel': 'Запятая'
    },
    'ja': {
        'settings': '設定',
        'back': '戻る',
        'decimalSeparatorLabel': '小数点区切り',
        'thousandsSeparatorLabel': '桁区切り',
        'decimalPlacesLabel': '小数点以下の桁数',
        'languageLabel': '言語',
        'previewLabel': '形式プレビュー:',
        'none': 'なし',
        'space': 'スペース',
        'delete': '削除',
        'popupWindow': 'ポップアップウィンドウ',
        'searchPlaceholder': '通貨を検索...',
        'noResults': '一致する結果がありません',
        'dotLabel': 'ドット',
        'commaLabel': 'カンマ'
    },
    'de': {
        'settings': 'Einstellungen',
        'back': 'Zurück',
        'decimalSeparatorLabel': 'Dezimaltrennzeichen',
        'thousandsSeparatorLabel': 'Tausendertrennzeichen',
        'decimalPlacesLabel': 'Dezimalstellen',
        'languageLabel': 'Sprache',
        'previewLabel': 'Formatvorschau:',
        'none': 'Keine',
        'space': 'Leerzeichen',
        'delete': 'Löschen',
        'popupWindow': 'Popup-Fenster',
        'searchPlaceholder': 'Währung suchen...',
        'noResults': 'Keine Treffer',
        'dotLabel': 'Punkt',
        'commaLabel': 'Komma'
    },
    'fr': {
        'settings': 'Paramètres',
        'back': 'Retour',
        'decimalSeparatorLabel': 'Séparateur décimal',
        'thousandsSeparatorLabel': 'Séparateur des milliers',
        'decimalPlacesLabel': 'Décimales',
        'languageLabel': 'Langue',
        'previewLabel': 'Aperçu du format:',
        'none': 'Aucun',
        'space': 'Espace',
        'delete': 'Supprimer',
        'popupWindow': 'Fenêtre pop-up',
        'searchPlaceholder': 'Rechercher une devise...',
        'noResults': 'Aucun résultat',
        'dotLabel': 'Point',
        'commaLabel': 'Virgule'
    },
    'ko': {
        'settings': '설정',
        'back': '뒤로',
        'decimalSeparatorLabel': '소수 구분 기호',
        'thousandsSeparatorLabel': '천 단위 구분 기호',
        'decimalPlacesLabel': '소수 자릿수',
        'languageLabel': '언어',
        'previewLabel': '형식 미리보기:',
        'none': '없음',
        'space': '공백',
        'delete': '삭제',
        'popupWindow': '팝업 창',
        'searchPlaceholder': '통화 검색...',
        'noResults': '일치하는 결과 없음',
        'dotLabel': '점',
        'commaLabel': '쉼표'
    }
};

Object.keys(settingsTranslations).forEach(lang => {
    translations[lang] = {
        ...translations['en'],
        ...(translations[lang] || {}),
        ...settingsTranslations[lang]
    };
});

//取得用戶語言設定 (向後相容)
async function getUserLanguage() {
    return currentLanguage;
}

function normalizeDecimalPlaces(value) {
    const places = Number(value);
    return [0, 1, 2].includes(places) ? places : 2;
}

function getSupportedLanguages(config = currencyConfig) {
    const languages = [];
    if (!config) return ['en'];

    [...Object.values(config.fiat || {}), ...Object.values(config.crypto || {})].forEach(currency => {
        Object.keys(currency.names || {}).forEach(lang => {
            if (!languages.includes(lang)) {
                languages.push(lang);
            }
        });
    });

    return languages.length ? languages : ['en'];
}

function resolveSupportedLanguage(language, supportedLanguages = getSupportedLanguages()) {
    const supported = supportedLanguages.length ? supportedLanguages : ['en'];
    const fallback = supported.includes('en') ? 'en' : supported[0];
    if (!language) return fallback;

    const candidate = String(language).replace('_', '-');
    const exact = supported.find(lang => lang.toLowerCase() === candidate.toLowerCase());
    if (exact) return exact;

    const lowerCandidate = candidate.toLowerCase();
    if (lowerCandidate.startsWith('zh')) {
        if ((lowerCandidate.includes('hant') || lowerCandidate === 'zh-tw' || lowerCandidate === 'zh-hk' || lowerCandidate === 'zh-mo') && supported.includes('zh-TW')) {
            return 'zh-TW';
        }
        if (lowerCandidate.includes('hans') && supported.includes('zh-CN')) return 'zh-CN';
        if (supported.includes('zh-CN')) return 'zh-CN';
        if (supported.includes('zh-TW')) return 'zh-TW';
    }

    const baseLanguage = lowerCandidate.split('-')[0];
    const base = supported.find(lang => lang.toLowerCase() === baseLanguage);
    return base || fallback;
}

// 加載用戶設定與多語系
async function loadUserSettings() {
    return new Promise((resolve) => {
        chrome.storage.sync.get(['userSettings', 'userLanguage'], function(result) {
            let migrated = false;
            let settings = result.userSettings;
            const supportedLanguages = getSupportedLanguages();

            if (settings) {
                currentDecimalSeparator = settings.decimalSeparator || '.';
                currentThousandsSeparator = settings.thousandsSeparator !== undefined ? settings.thousandsSeparator : ',';
                currentDecimalPlaces = normalizeDecimalPlaces(settings.decimalPlaces);
                if (settings.userLanguage) {
                    currentLanguage = resolveSupportedLanguage(settings.userLanguage, supportedLanguages);
                    if (currentLanguage !== settings.userLanguage) {
                        migrated = true;
                    }
                } else {
                    currentLanguage = '';
                }
                if (settings.decimalPlaces === undefined) {
                    migrated = true;
                }
            } else {
                currentDecimalSeparator = '.';
                currentThousandsSeparator = ',';
                currentDecimalPlaces = 2;
                currentLanguage = '';
            }

            // 處理向後相容性與遷移 (Migration to userSettings)
            if (!currentLanguage) {
                if (result.userLanguage) {
                    currentLanguage = resolveSupportedLanguage(result.userLanguage, supportedLanguages);
                    migrated = true;
                } else {
                    const browserLang = (navigator.languages && navigator.languages[0]) || navigator.language || navigator.userLanguage;
                    currentLanguage = resolveSupportedLanguage(browserLang, supportedLanguages);
                    migrated = true;
                }
            }

            if (!settings || migrated) {
                chrome.storage.sync.set({
                    userSettings: {
                        decimalSeparator: currentDecimalSeparator,
                        thousandsSeparator: currentThousandsSeparator,
                        decimalPlaces: currentDecimalPlaces,
                        userLanguage: currentLanguage
                    }
                });
            }
            resolve();
        });
    });
}

// 客製化數字格式化函數
function formatCustomNumber(value, decimalSep, thousandsSep, decimalPlaces = 2) {
    const places = normalizeDecimalPlaces(decimalPlaces);
    const number = Number(value);
    const safeNumber = isNaN(number) ? 0 : number;

    // 處理負數符號
    const isNegative = safeNumber < 0;
    const absNumber = Math.abs(safeNumber);

    let integerPart = "";
    let decimalPart = "";

    let displayPlaces = places;
    if (absNumber > 0) {
        if (absNumber < 1) {
            displayPlaces = Math.max(displayPlaces, 2);
        }
        while (Number(absNumber.toFixed(displayPlaces)) === 0 && displayPlaces < 8) {
            displayPlaces++;
        }
    }

    const parts = absNumber.toFixed(displayPlaces).split('.');
    integerPart = parts[0];
    decimalPart = parts[1] || "";

    // 為整數部分添加自訂千分位分隔符
    if (thousandsSep !== undefined && thousandsSep !== "") {
        integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSep);
    }

    let result = integerPart;
    if (decimalPart) {
        result += decimalSep + decimalPart;
    }

    return isNegative ? "-" + result : result;
}

// 更新格式預覽
function updateFormatPreview() {
    const formatPreview = document.getElementById('format-preview');
    if (formatPreview) {
        formatPreview.textContent = formatCustomNumber(12345.67, currentDecimalSeparator, currentThousandsSeparator, currentDecimalPlaces);
    }
}

// Helper function to update segmented control active state
function updateSegmentedControl(containerId, value) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const buttons = container.querySelectorAll('.segmented-item');
    buttons.forEach(btn => {
        if (btn.getAttribute('data-value') === value) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

function populateLanguageSelect(select) {
    if (!select) return;
    const supportedLanguages = getSupportedLanguages();
    select.innerHTML = '';
    supportedLanguages.forEach(lang => {
        const option = document.createElement('option');
        option.value = lang;
        option.textContent = languageLabels[lang] || lang;
        select.appendChild(option);
    });
}

// 初始化設定面板 UI
function initSettingsUI() {
    const decimalSepToggle = document.getElementById('decimal-separator-toggle');
    const thousandsSepToggle = document.getElementById('thousands-separator-toggle');
    const decimalPlacesSelect = document.getElementById('decimal-places-select');
    const languageSelect = document.getElementById('language-select');

    if (decimalSepToggle) {
        updateSegmentedControl('decimal-separator-toggle', currentDecimalSeparator);
        decimalSepToggle.addEventListener('click', (e) => {
            const btn = e.target.closest('.segmented-item');
            if (!btn) return;
            currentDecimalSeparator = btn.getAttribute('data-value');
            updateSegmentedControl('decimal-separator-toggle', currentDecimalSeparator);
            handleSeparatorConflict('decimal');
            saveUserSettingsAndRefresh();
        });
    }

    if (thousandsSepToggle) {
        updateSegmentedControl('thousands-separator-toggle', currentThousandsSeparator);
        thousandsSepToggle.addEventListener('click', (e) => {
            const btn = e.target.closest('.segmented-item');
            if (!btn) return;
            currentThousandsSeparator = btn.getAttribute('data-value');
            updateSegmentedControl('thousands-separator-toggle', currentThousandsSeparator);
            handleSeparatorConflict('thousands');
            saveUserSettingsAndRefresh();
        });
    }

    if (decimalPlacesSelect) {
        decimalPlacesSelect.value = String(currentDecimalPlaces);
        decimalPlacesSelect.addEventListener('change', (e) => {
            currentDecimalPlaces = normalizeDecimalPlaces(e.target.value);
            saveUserSettingsAndRefresh();
        });
    }

    if (languageSelect) {
        populateLanguageSelect(languageSelect);
        languageSelect.value = currentLanguage || 'en';
        languageSelect.addEventListener('change', (e) => {
            currentLanguage = e.target.value;
            applyLanguage(currentLanguage);
            saveUserSettingsAndRefresh();
        });
    }

    updateFormatPreview();
}

// 處理小數點與千分位衝突 (US3)
function handleSeparatorConflict(changedSource) {
    if (currentDecimalSeparator === currentThousandsSeparator) {
        if (changedSource === 'decimal') {
            currentThousandsSeparator = currentDecimalSeparator === '.' ? ',' : '.';
            updateSegmentedControl('thousands-separator-toggle', currentThousandsSeparator);
        } else {
            currentDecimalSeparator = currentThousandsSeparator === '.' ? ',' : '.';
            updateSegmentedControl('decimal-separator-toggle', currentDecimalSeparator);
        }
    }
}

// 儲存設定並更新 UI
function saveUserSettingsAndRefresh() {
    chrome.storage.sync.set({
        userSettings: {
            decimalSeparator: currentDecimalSeparator,
            thousandsSeparator: currentThousandsSeparator,
            decimalPlaces: currentDecimalPlaces,
            userLanguage: currentLanguage
        }
    }, () => {
        updateFormatPreview();
        updateAllAmounts(lastEditedAmount, lastEditedCurrency);
    });
}

// 套用語系翻譯 (US4)
function applyLanguage(lang) {
    document.documentElement.lang = lang;

    // 翻譯所有帶有 data-i18n 屬性的元素
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        const translation = getTranslation(key, lang);
        if (translation) {
            element.textContent = translation;
        }
    });

    // 翻譯所有帶有 data-i18n-title 屬性的元素
    document.querySelectorAll('[data-i18n-title]').forEach(element => {
        const key = element.getAttribute('data-i18n-title');
        const translation = getTranslation(key, lang);
        if (translation) {
            element.setAttribute('title', translation);
        }
    });

    // 翻譯所有帶有 data-i18n-placeholder 屬性的元素
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
        const key = element.getAttribute('data-i18n-placeholder');
        const translation = getTranslation(key, lang);
        if (translation) {
            element.setAttribute('placeholder', translation);
        }
    });
    
    // 額外更新一些動態或特殊的 UI
    const deleteButtons = document.querySelectorAll('.delete-button');
    deleteButtons.forEach(btn => {
        btn.setAttribute('title', getTranslation('delete', lang));
    });

    // 更新記憶體中的貨幣名稱並刷新模態框
    if (currencyConfig && allCurrencies) {
        Object.keys(allCurrencies).forEach(code => {
            allCurrencies[code].name = getCountryName(code, lang);
        });
        populateAllCurrencies();
    }
}

// 加載貨幣配置
async function loadCurrencyConfig() {
    try {
        const cachedConfig = await getFromCache('currencyConfig');
        if (cachedConfig && !isCacheExpired(cachedConfig.timestamp, CURRENCY_INFO_CACHE_DURATION)) {
            currencyConfig = cachedConfig.data;
            //console.log('Using cached currency config');
        } else {
            const response = await fetch('currency_config.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            currencyConfig = await response.json();
            saveToCache('currencyConfig', currencyConfig, CURRENCY_INFO_CACHE_DURATION);
            //console.log('Fetched and cached new currency config');
        }

        // 初始化 cryptoCurrencies 對象
        cryptoCurrencies = { ...currencyConfig.crypto };

        // 填充 allCurrencies 對象
        allCurrencies = {
            ...Object.keys(currencyConfig.fiat).reduce((acc, code) => {
                acc[code] = {
                    code: code,
                    name: getCountryName(code, currentLanguage),
                    type: 'fiat'
                };
                return acc;
            }, {}),
            ...Object.keys(currencyConfig.crypto).reduce((acc, code) => {
                acc[code] = {
                    ...currencyConfig.crypto[code],
                    type: 'crypto',
                    name: getCountryName(code, currentLanguage)
                };
                return acc;
            }, {})
        };

    } catch (error) {
        //console.error('Error loading currency config:', error);
    }
}


// 獲取貨幣符號
function getCurrencySymbol(currency) {
    if (currencyConfig.crypto[currency] && currencyConfig.crypto[currency].symbol) {
        return currencyConfig.crypto[currency].symbol;
    } else if (currencyConfig.fiat[currency] && currencyConfig.fiat[currency].symbol) {
        return currencyConfig.fiat[currency].symbol;
    }
    return currency;
}

// 獲取貨幣名稱
function getCountryName(code, lang = 'en') {
    const config = currencyConfig.fiat[code] || currencyConfig.crypto[code];
    return config?.names[lang] || config?.names['en'] || code;
}

// 獲取貨幣圖標
function getCurrencyIcon(currency) {
    if (currencyConfig.crypto[currency]) {
        // 對於加密貨幣，返回 symbol
        return currencyConfig.crypto[currency].symbol.charAt(0);
    } else {
        // 對於一般貨幣，使用國旗圖標
        let countryCode = currency.slice(0, 2).toLowerCase();
        
        // 處理特殊情況
        switch (currency) {
            case 'EUR':
                countryCode = 'eu';
                break;
            // 添加其他特殊情況...
        }
        
        return `fi fi-${countryCode}`;
    }
}

// 保存用戶的最後輸入
function saveLastInput() {
    chrome.storage.sync.set({
        lastEditedCurrency: lastEditedCurrency,
        lastEditedAmount: lastEditedAmount
    });
}

// 獲取用戶的最後輸入
async function getLastInput() {
    return new Promise((resolve) => {
        chrome.storage.sync.get(['lastEditedCurrency', 'lastEditedAmount'], function(result) {
            lastEditedCurrency = result.lastEditedCurrency || 'USD';
            lastEditedAmount = result.lastEditedAmount || 100;
            resolve();
        });
    });
}

// 初始化貨幣列表
async function initCurrencyList() {
    try {
        await getLastInput();
        const savedOrder = await getSavedOrder();
        
        currencyList.innerHTML = '';
        
        let currencies = savedOrder.length > 0 ? savedOrder : defaultCurrencies;
        
        // 嘗試使用快取的匯率
        const cachedRates = await getFromCache('exchangeRates');
        const hasValidCache = cachedRates && !isCacheEmpty(cachedRates.data);
        
        // 如果有有效的快取（即使已過期），先使用它
        if (hasValidCache) {
            fiatRates = cachedRates.data.fiatRates;
            cryptoRates = cachedRates.data.cryptoRates;
            btcToUsd = cachedRates.data.btcToUsd;
            
            // 正常顯示貨幣列表（無骨架屏）
            currencies.forEach(currency => {
                addCurrencyItem(currency);
            });
            
            // 更新所有金額
            updateAllAmounts(lastEditedAmount, lastEditedCurrency);
            
            // 如果快取已過期，在背景更新匯率
            if (isCacheExpired(cachedRates.timestamp)) {
                updateExchangeRates(false); // 不顯示載入動畫
            }
        } else {
            // 如果沒有有效的快取，顯示骨架屏並等待匯率更新
            currencies.forEach(currency => {
                const item = addCurrencyItem(currency);
                item.classList.add('skeleton'); // 添加骨架屏類
            });
            
            // 獲取最新匯率並更新UI
            await updateExchangeRates(true); // 顯示載入動畫
        }
        
        //console.log('Currency list initialized');
    } catch (error) {
        //console.error('Error initializing currency list:', error);
        showError('Failed to initialize currency list. Please try again.');
    }
}

// 檢查快取是否為空
function isCacheEmpty(cacheData) {
    return !cacheData || 
           !cacheData.fiatRates || 
           !cacheData.cryptoRates || 
           Object.keys(cacheData.fiatRates).length === 0 || 
           Object.keys(cacheData.cryptoRates).length === 0;
}

// 添加貨幣項目
function addCurrencyItem(currency) {
    const existingItem = document.querySelector(`.currency-item[data-currency="${currency}"]`);
    if (existingItem) {
        return existingItem;
    }

    const item = document.createElement('li');
    item.className = 'currency-item';
    item.dataset.currency = currency;
    
    const iconContent = getCurrencyIcon(currency);
    const isCrypto = currencyConfig.crypto[currency] !== undefined;

    item.innerHTML = `
        <span class="drag-handle"><i class="fas fa-grip-lines"></i></span>
        <span class="currency-icon ${isCrypto ? 'crypto-icon' : iconContent}">${isCrypto ? iconContent : ''}</span>
        <span class="currency-code">${currency}</span>
        <div class="input-wrapper">
            <div class="skeleton-loader"></div>
            <input type="text" class="amount-input" data-currency="${currency}" value="">
            <span class="currency-symbol">${getCurrencySymbol(currency)}</span>
        </div>
        <button class="delete-button" title="${getTranslation('delete', currentLanguage)}"><i class="fas fa-times"></i></button>
    `;

    const input = item.querySelector('.amount-input');
    
    // 添加所有必要的事件監聽器
    input.addEventListener('input', handleAmountInput);
    input.addEventListener('focus', handleAmountFocus);
    input.addEventListener('blur', handleAmountBlur);
    input.addEventListener('keydown', handleAmountKeydown);  // 添加鍵盤事件監聽器

    const deleteButton = item.querySelector('.delete-button');
    deleteButton.addEventListener('click', () => deleteCurrencyItem(item));

    currencyList.appendChild(item);
    return item;
}

//更新特定貨幣的金額顯示
function updateCurrencyAmount(currency, amount) {
    const item = document.querySelector(`.currency-item[data-currency="${currency}"]`);
    if (!item) return;

    const input = item.querySelector('.amount-input');
    const formattedAmount = currency === lastEditedCurrency ? formatUserInput(amount) : formatConversionResult(amount);
    input.value = formattedAmount;
    input.classList.toggle('last-edited', currency === lastEditedCurrency);
    
    // 移除骨架屏效果
    item.classList.remove('skeleton');
}

// 獲取翻譯文本
function getTranslation(key, lang = currentLanguage) {
    return translations[lang]?.[key] || translations['en'][key];
}

// 格式化字符串，用參數替換 {0}, {1} 等佔位符
function formatString(str, ...args) {
    return str.replace(/{(\d+)}/g, (match, index) => {
        return typeof args[index] !== 'undefined' ? args[index] : match;
    });
}

// 顯示確認對話框
function showConfirmDialog(title, message, onConfirm) {
    const dialog = document.getElementById('confirm-dialog');
    const titleElement = document.getElementById('confirm-title');
    const messageElement = document.getElementById('confirm-message');
    const confirmButton = document.getElementById('confirm-button');
    const cancelButton = document.getElementById('cancel-button');
    
    // 設置標題和消息
    titleElement.textContent = title;
    messageElement.textContent = message;
    
    // 設置按鈕文本
    confirmButton.textContent = getTranslation('confirm');
    cancelButton.textContent = getTranslation('cancel');
    
    // 綁定事件
    const handleConfirm = () => {
        dialog.classList.remove('show');
        onConfirm();
        cleanup();
    };
    
    const handleCancel = () => {
        dialog.classList.remove('show');
        cleanup();
    };
    
    const handleOutsideClick = (e) => {
        if (e.target === dialog) {
            dialog.classList.remove('show');
            cleanup();
        }
    };
    
    // 清理函數
    const cleanup = () => {
        confirmButton.removeEventListener('click', handleConfirm);
        cancelButton.removeEventListener('click', handleCancel);
        dialog.removeEventListener('click', handleOutsideClick);
    };
    
    // 添加事件監聽器
    confirmButton.addEventListener('click', handleConfirm);
    cancelButton.addEventListener('click', handleCancel);
    dialog.addEventListener('click', handleOutsideClick);
    
    // 顯示對話框
    dialog.classList.add('show');
}

// 刪除貨幣項目
function deleteCurrencyItem(item) {
    if (currencyList.children.length > 1) {
        const currency = item.dataset.currency;
        const currencyName = getCountryName(currency, currentLanguage);
        
        // 使用自定義對話框
        const title = getTranslation('confirmDelete');
        const message = formatString(getTranslation('confirmDeleteMessage'), currency, currencyName);
        
        showConfirmDialog(title, message, () => {
            item.remove();
            saveOrder();
            updateDeleteButtons();
            updateExchangeRates(); // 重新計算匯率
        });
    }
}

// 更新刪除狀態
function updateDeleteButtons() {
    const deleteButtons = document.querySelectorAll('.delete-button');
    const isDisabled = currencyList.children.length <= 1;
    deleteButtons.forEach(button => {
        button.classList.toggle('disabled', isDisabled);
        button.disabled = isDisabled;
    });
}

// 處理金額輸入
// 處理金額輸入
function handleAmountInput(event) {
    const input = event.target;
    const cursorPosition = input.selectionStart;
    const oldValue = input.value;
    
    // 移除任何非法字元（允許數字、運算符號、括號、空格、逗號、點）
    const newValue = oldValue.replace(/[^0-9.+\-*/(), ]/g, '');
    
    // 如果有非法字元，恢復原值
    if (newValue !== oldValue) {
        input.value = oldValue;
        input.setSelectionRange(cursorPosition - 1, cursorPosition - 1);
        return;
    }
    
    // 移除千分位分隔符以進行純數字/算式處理
    let cleanValue = newValue;
    if (currentThousandsSeparator) {
        cleanValue = cleanValue.split(currentThousandsSeparator).join('');
    }
    
    // 正規化小數點為標準 '.' 以便計算與解析
    let cleanValueForEval = cleanValue;
    if (currentDecimalSeparator !== '.') {
        cleanValueForEval = cleanValue.split(currentDecimalSeparator).join('.');
    }
    
    // 檢查是否包含運算符
    if (/[+\-*/]/.test(cleanValueForEval)) {
        // 允許輸入運算符和數字
        if (!/^[\d.+\-*/\s()]+$/.test(cleanValueForEval)) {
            input.value = oldValue;
            input.setSelectionRange(cursorPosition, cursorPosition);
            return;
        }
        
        // 保持當前輸入框的算式 (保留使用者輸入的小數點)
        input.value = cleanValue;
        
        // 嘗試計算結果
        const result = evaluateExpression(cleanValueForEval);
        
        if (result !== null) {
            // 將計算結果四捨五入到兩位小數
            const roundedResult = Math.round(result * 100) / 100;
            
            // 更新所有其他貨幣的金額
            lastEditedAmount = roundedResult;
            lastEditedCurrency = input.dataset.currency;
            
            // 更新其他貨幣的金額
            document.querySelectorAll('.currency-item').forEach(item => {
                const currency = item.dataset.currency;
                if (currency !== input.dataset.currency) {
                    const convertedAmount = convert(roundedResult, input.dataset.currency, currency);
                    updateCurrencyAmount(currency, convertedAmount);
                }
            });
            
            saveLastInput();
        }
    } else {
        // 數字處理邏輯
        if (cleanValue !== '') {
            const amount = parseFloat(cleanValueForEval);
            if (!isNaN(amount)) {
                // 先更新所有金額，確保使用正確的數值
                lastEditedAmount = amount;
                lastEditedCurrency = input.dataset.currency;
                updateAllAmounts(amount, input.dataset.currency);
                saveLastInput();
                
                // 然後格式化當前輸入框的顯示
                const formattedValue = formatNumberWithCommas(cleanValue);
                input.value = formattedValue;
                
                // 調整光標位置
                const newCursorPos = adjustCursorPosition(cleanValue, formattedValue, cursorPosition);
                input.setSelectionRange(newCursorPos, newCursorPos);
                return;
            }
        }
        input.value = cleanValue;
    }
    
    input.setSelectionRange(cursorPosition, cursorPosition);
    
    // 更新輸入框狀態
    input.classList.add('last-edited');
    document.querySelectorAll('.currency-item').forEach(item => {
        if (item.contains(input)) {
            item.classList.add('active-input');
        } else {
            item.classList.remove('active-input');
        }
    });
    
    document.querySelectorAll('.amount-input').forEach(inp => {
        if (inp !== input) inp.classList.remove('last-edited');
    });
}

// 新增函數：格式化數字，添加自訂千分位分隔符
function formatNumberWithCommas(numStr) {
    // 依據當前是否已包含自訂小數點來進行分割
    const sep = numStr.includes(currentDecimalSeparator) ? currentDecimalSeparator : '.';
    const parts = numStr.split(sep);
    let intPart = parts[0];
    const decPart = parts[1];
    
    if (currentThousandsSeparator) {
        intPart = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, currentThousandsSeparator);
    }
    
    return decPart !== undefined ? intPart + currentDecimalSeparator + decPart : intPart;
}

// 修正：調整光標位置以考慮新增的分隔符
function adjustCursorPosition(oldValue, newValue, oldPosition) {
    // 移除所有千分位分隔符，以便比較純數字
    const cleanOldValue = currentThousandsSeparator ? oldValue.split(currentThousandsSeparator).join('') : oldValue;
    
    // 計算游標前的數字部分
    const beforeCursor = cleanOldValue.substring(0, oldPosition);
    
    // 在新值中找到相應位置
    // 首先格式化游標前的部分
    const formattedBeforeCursor = formatNumberWithCommas(beforeCursor);
    
    // 游標應該放在格式化後的"游標前部分"的長度位置
    return formattedBeforeCursor.length;
}

// 新增函數：計算字符串中逗號的數量
function countCommas(str) {
    return (str.match(/,/g) || []).length;
}

// 處理金額輸入框獲得焦點
function handleAmountFocus(event) {
    const input = event.target;
    const currentValue = input.value;
    
    // 保存原始值，用於檢測是否有變更
    input.dataset.originalValue = currentValue;
    
    // 選中全部內容
    input.select();
    
    // 添加 active-input 類到當前輸入項目
    document.querySelectorAll('.currency-item').forEach(item => {
        if (item.contains(input)) {
            item.classList.add('active-input');
        } else {
            item.classList.remove('active-input');
        }
    });
}

// 處理金額輸入框失去焦點
function handleAmountBlur(event) {
    const input = event.target;
    const currentValue = input.value;
    const originalValue = input.dataset.originalValue || '';
    
    // 檢查值是否有變更
    if (currentValue === originalValue) {
        // 如果值沒有變更，不進行任何操作
        input.closest('.currency-item').classList.remove('active-input');
        return;
    }
    
    // 檢查是否包含運算符
    if (/[+\-*/]/.test(currentValue)) {
        const result = evaluateExpression(currentValue);
        if (result !== null) {
            // 將計算結果四捨五入到兩位小數
            const roundedResult = Math.round(result * 100) / 100;
            
            // 使用計算結果更新顯示和值
            lastEditedAmount = roundedResult;
            lastEditedCurrency = input.dataset.currency;
            input.value = formatConversionResult(roundedResult);
            updateAllAmounts(roundedResult, input.dataset.currency);
            saveLastInput();
        } else {
            // 使用上一個有效值
            input.value = formatConversionResult(lastEditedAmount);
            updateAllAmounts(lastEditedAmount, input.dataset.currency);
        }
    } else {
        // 原有的處理邏輯
        const amount = parseFormattedNumber(currentValue);
        if (isNaN(amount) || amount === 0) {
            input.value = formatConversionResult(0);
            lastEditedAmount = 0;
        } else {
            input.value = formatConversionResult(amount);
            lastEditedAmount = amount;
            lastEditedCurrency = input.dataset.currency;
        }
        updateAllAmounts(lastEditedAmount, input.dataset.currency);
        saveLastInput();
    }
    
    // 移除 active-input 類
    input.closest('.currency-item').classList.remove('active-input');
    
    // 更新所有輸入框的 last-edited 狀態
    document.querySelectorAll('.amount-input').forEach(inp => {
        inp.classList.toggle('last-edited', inp === input);
    });
}

// 新增鍵盤事件處理函數
function handleAmountKeydown(event) {
    // 允許的按鍵：數字、小數點、逗號、運算符號、括號、方向鍵、刪除鍵等
    const allowedKeys = [
        '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
        '.', ',', '+', '-', '*', '/', '(', ')',
        'Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab',
        'Home', 'End', 'Enter'
    ];

    // 允許 Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+A
    if (event.ctrlKey && ['c', 'v', 'x', 'a'].includes(event.key.toLowerCase())) {
        return;
    }

    // 如果不是允許的按鍵，阻止輸入
    if (!allowedKeys.includes(event.key)) {
        event.preventDefault();
        return;
    }

    // 特別處理小數點與分號：確保只有一個自訂小數點
    if (event.key === '.' || event.key === ',') {
        const activeKey = currentDecimalSeparator;
        event.preventDefault();
        
        const value = event.target.value;
        const cursorPosition = event.target.selectionStart;
        const selectedText = window.getSelection().toString();
        
        const valueWithoutSelection = selectedText ? 
            value.slice(0, cursorPosition) + value.slice(cursorPosition + selectedText.length) :
            value;
            
        if (!valueWithoutSelection.includes(activeKey)) {
            // 在游標處插入當前設定的自訂小數點
            const newValue = value.slice(0, cursorPosition) + activeKey + value.slice(event.target.selectionEnd);
            event.target.value = newValue;
            event.target.setSelectionRange(cursorPosition + 1, cursorPosition + 1);
            // 觸發 input 事件以便即時更新與計算
            event.target.dispatchEvent(new Event('input'));
        }
        return;
    }

    // 特別處理運算符號：防止連續輸入運算符號
    if (['+', '-', '*', '/'].includes(event.key)) {
        const value = event.target.value;
        const cursorPosition = event.target.selectionStart;
        
        // 檢查前一個字元是否為運算符號
        const prevChar = value[cursorPosition - 1];
        if (prevChar && ['+', '-', '*', '/'].includes(prevChar)) {
            event.preventDefault();
            return;
        }
    }

    // 處理 Enter 鍵
    if (event.key === 'Enter') {
        event.preventDefault();
        event.target.blur();
    }
}

// 貨幣轉換（確保這個函數存在並正確實現）
function convert(amount, fromCurrency, toCurrency) {
    // 檢查匯率是否可用
    if (!isCurrencyAvailable(fromCurrency) || !isCurrencyAvailable(toCurrency)) {
        //console.error(`Exchange rate not available for ${fromCurrency} or ${toCurrency}`);
        return amount; // 返回原始金額作為默認值
    }
    
    // 如果源貨幣和目標貨幣相同，直接返回金額
    if (fromCurrency === toCurrency) {
        return amount;
    }
    
    let result;
    
    if (isFiat(fromCurrency) && isFiat(toCurrency)) {
        // 法幣到法幣的轉換
        result = (amount / fiatRates[fromCurrency]) * fiatRates[toCurrency];
    } else if (isFiat(fromCurrency) && isCrypto(toCurrency)) {
        // 法幣到加密貨幣的轉換
        const usdAmount = amount / fiatRates[fromCurrency];
        const btcAmount = usdAmount / btcToUsd;
        result = btcAmount / cryptoRates[toCurrency];
    } else if (isCrypto(fromCurrency) && isFiat(toCurrency)) {
        // 加密貨幣到法幣的轉換
        const btcAmount = amount * cryptoRates[fromCurrency];
        const usdAmount = btcAmount * btcToUsd;
        result = usdAmount * fiatRates[toCurrency];
    } else {
        // 加密貨幣到加密貨幣的轉換
        const fromBtcAmount = amount * cryptoRates[fromCurrency];
        result = fromBtcAmount / cryptoRates[toCurrency];
    }
    
    return result;
}

// 輔助函數
function isFiat(currency) {
    return currency in fiatRates;
}

function isCrypto(currency) {
    return currency in cryptoRates;
}

function isCurrencyAvailable(currency) {
    return isFiat(currency) || isCrypto(currency);
}

// 更新匯率，增加參數控制是否顯示載入動畫
async function updateExchangeRates(showLoadingAnimation = true) {
    try {
        // 獲取法定貨幣匯率
        const fiatResponse = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        if (fiatResponse.status === 200) {
            const fiatData = await fiatResponse.json();
            fiatRates = fiatData.rates;
        } else {
            throw new Error(`HTTP error! status: ${fiatResponse.status}`);
        }

        // 獲取加密貨幣匯率
        const cryptoResponse = await fetch('https://api.coingecko.com/api/v3/exchange_rates');
        if (cryptoResponse.status === 200) {
            const cryptoData = await cryptoResponse.json();
            btcToUsd = cryptoData.rates.usd.value;
        
            // 更新加密貨幣匯率，只包含有匯率的加密貨幣
            cryptoRates = {};
            Object.keys(cryptoData.rates).forEach(crypto => {
                const upperCaseCrypto = crypto.toUpperCase();
                if (cryptoCurrencies[upperCaseCrypto]) {
                    cryptoRates[upperCaseCrypto] = 1 / cryptoData.rates[crypto].value;
                }
            });
        
            // 確保 BTC 對自身的匯率為 1
            cryptoRates['BTC'] = 1;
        } else {
            throw new Error(`HTTP error! status: ${cryptoResponse.status}`);
        }

        // 保存到快取
        saveToCache('exchangeRates', {
            fiatRates: fiatRates,
            cryptoRates: cryptoRates,
            btcToUsd: btcToUsd
        });

        // 更新所有金額
        updateAllAmounts(lastEditedAmount, lastEditedCurrency);

        // 重新填充所有貨幣列表
        populateAllCurrencies();
        
        // 如果需要顯示載入動畫，則移除骨架屏效果
        if (showLoadingAnimation) {
            document.querySelectorAll('.currency-item.skeleton').forEach(item => {
                item.classList.remove('skeleton');
            });
        }

    } catch (error) {
        //console.error('Failed to update exchange rates:', error);
        // 如果我們沒有任何匯率數據（首次加載失敗），顯示一個錯誤
        if (!Object.keys(fiatRates).length && !Object.keys(cryptoRates).length) {
            showError('Failed to load exchange rates. Please check your internet connection and try again.');
        }
    }
}

// 初始化 Sortable
function initSortable() {
    if (typeof Sortable !== 'undefined' && Sortable.create) {
        Sortable.create(currencyList, {
            animation: 150,
            handle: '.drag-handle', // 只有拖放按鈕可以觸發拖動
            draggable: '.currency-item', // 整個貨幣項目是可拖動的元素
            onEnd: function () {
                saveOrder();
            }
        });
    } else {
        console.warn('Sortable library not found. Drag and drop functionality may not work.');
    }
}

// 保存貨幣順序
// 修改 saveOrder 函數以接受參數
function saveOrder() {
    const order = Array.from(currencyList.children).map(item => item.dataset.currency);
    return new Promise((resolve) => {
        chrome.storage.sync.set({ currencyOrder: order }, function() {
            //console.log('Order saved:', order);
            resolve();
        });
    });
}

// 獲取保存的貨幣順序
function getSavedOrder() {
    return new Promise((resolve) => {
        chrome.storage.sync.get('currencyOrder', function(result) {
            resolve(result.currencyOrder || defaultCurrencies);
        });
    });
}

// 填充所有貨幣列表
function populateAllCurrencies() {
    //console.log('Populating all currencies');
    const allCurrenciesList = document.getElementById('all-currencies');
    const noResultsDiv = document.getElementById('no-results');
    if (!allCurrenciesList || !noResultsDiv) {
        //console.error('Required elements not found');
        return;
    }
    allCurrenciesList.innerHTML = '';

    // 將貨幣轉換為數組並排序
    const sortedCurrencies = Object.entries(allCurrencies).sort((a, b) => a[0].localeCompare(b[0]));

    //console.log('Total currencies to display:', sortedCurrencies.length);

    let visibleCount = 0;

    sortedCurrencies.forEach(([code, config]) => {
        const item = document.createElement('li');
        item.className = 'all-currency-item';
        item.dataset.currency = code;
        const isAdded = Array.from(document.querySelectorAll('#currency-list li')).some(el => el.dataset.currency === code);
        const iconContent = getCurrencyIcon(code);
        const isCrypto = config.type === 'crypto';
        const currencyName = config.name;
        
        item.innerHTML = `
            <span class="currency-icon ${isCrypto ? 'crypto-icon' : iconContent}">${isCrypto ? iconContent : ''}</span>
            <span>${code} - ${currencyName}</span>
            <i class="fas ${isAdded ? 'fa-check added-icon' : 'fa-plus add-icon'}"></i>
        `;
        item.addEventListener('click', () => toggleCurrencyInMain(code));

        if (currentSearchTerm === '' || `${code} ${currencyName}`.toLowerCase().includes(currentSearchTerm.toLowerCase())) {
            item.style.display = '';
            visibleCount++;
        } else {
            item.style.display = 'none';
        }

        allCurrenciesList.appendChild(item);
    });

    //console.log('Visible currencies:', visibleCount);

    noResultsDiv.style.display = visibleCount === 0 ? 'block' : 'none';
    //console.log('All currencies populated');
}

// 在主畫面中添加或移除貨幣
function toggleCurrencyInMain(code) {
    const existingItem = Array.from(currencyList.children).find(el => el.dataset.currency === code);
    if (existingItem) {
        existingItem.remove();
    } else {
        addCurrencyItem(code);
        // 立即更新新添加貨幣的金額
        updateCurrencyAmount(code, convert(lastEditedAmount, lastEditedCurrency, code));
    }
    saveOrder();
    updateDeleteButtons();
    populateAllCurrencies(); // 重新填充列表，保持搜索狀態
}

// 修改計算算式的函數
function evaluateExpression(expression) {
    try {
        // 移除所有空格和千分位逗號
        expression = expression.replace(/\s+/g, '').replace(/,/g, '');
        
        // 檢查是否為不完整的算式
        if (/[+\-*/]$/.test(expression)) {
            return null;
        }
        
        // 檢查算式是否只包含數字和運算符
        if (!/^[\d.+\-*/()]+$/.test(expression)) {
            return null;
        }
        
        // 將算式分解為數字和運算符
        const tokens = expression.match(/(\d*\.?\d+)|[+\-*/()]/g);
        if (!tokens) return null;
        
        // 使用堆疊來計算結果
        const numbers = [];
        const operators = [];
        
        function precedence(op) {
            switch(op) {
                case '+': case '-': return 1;
                case '*': case '/': return 2;
                default: return 0;
            }
        }
        
        function calculate(a, b, op) {
            switch(op) {
                case '+': return a + b;
                case '-': return a - b;
                case '*': return a * b;
                case '/': return b === 0 ? null : a / b;
                default: return null;
            }
        }
        
        function processOperator(op) {
            while (operators.length > 0 && 
                   precedence(operators[operators.length - 1]) >= precedence(op)) {
                const b = numbers.pop();
                const a = numbers.pop();
                const operator = operators.pop();
                const result = calculate(a, b, operator);
                if (result === null) return null;
                numbers.push(result);
            }
            operators.push(op);
        }
        
        for (const token of tokens) {
            if (/\d/.test(token)) {
                numbers.push(parseFloat(token));
            } else if (token === '(') {
                operators.push(token);
            } else if (token === ')') {
                while (operators.length > 0 && operators[operators.length - 1] !== '(') {
                    const b = numbers.pop();
                    const a = numbers.pop();
                    const operator = operators.pop();
                    const result = calculate(a, b, operator);
                    if (result === null) return null;
                    numbers.push(result);
                }
                operators.pop(); // 移除 '('
            } else {
                processOperator(token);
            }
        }
        
        while (operators.length > 0) {
            const b = numbers.pop();
            const a = numbers.pop();
            const operator = operators.pop();
            const result = calculate(a, b, operator);
            if (result === null) return null;
            numbers.push(result);
        }
        
        const result = numbers[0];
        
        // 檢查結果是否為有效數字
        if (!isFinite(result) || isNaN(result)) {
            return null;
        }
        
        return result;
    } catch (e) {
        return null;
    }
}

// 修改格式化用戶輸入的函數
function formatUserInput(num) {
    // 如果輸入是字符串且包含運算符，直接返回
    if (typeof num === 'string' && /[+\-*/]/.test(num)) {
        return num;
    }
    return formatCustomNumber(num, currentDecimalSeparator, currentThousandsSeparator, currentDecimalPlaces);
}

// 修改解析格式化數字的函數
function parseFormattedNumber(str) {
    let normalized = str;
    if (currentThousandsSeparator) {
        normalized = normalized.split(currentThousandsSeparator).join('');
    }
    if (currentDecimalSeparator !== '.') {
        normalized = normalized.split(currentDecimalSeparator).join('.');
    }
    // 如果包含運算符，嘗試計算結果
    if (/[+\-*/]/.test(normalized)) {
        const result = evaluateExpression(normalized);
        return result !== null ? result : NaN;
    }
    return parseFloat(normalized);
}

// 新增处理转换结果的格式化函数
function formatConversionResult(num) {
    return formatCustomNumber(num, currentDecimalSeparator, currentThousandsSeparator, currentDecimalPlaces);
}

// 保存數據到快取
function saveToCache(key, data, duration = CACHE_DURATION) {
    const cacheData = {
        timestamp: Date.now(),
        expirationTime: Date.now() + duration,
        data: data
    };
    chrome.storage.local.set({ [key]: cacheData }, () => {
        //console.log(`Data cached for ${key}`);
    });
}

// 從快取中獲取數據
async function getFromCache(key) {
    return new Promise((resolve) => {
        chrome.storage.local.get(key, (result) => {
            if (result[key]) {
                //console.log(`Cache hit for ${key}`);
                resolve(result[key]);
            } else {
                //console.log(`Cache miss for ${key}`);
                resolve(null);
            }
        });
    });
}

// 檢查快取是否過期（這裡設置為 15 分鐘）
function isCacheExpired(timestamp, duration = CACHE_DURATION) {
    return Date.now() - timestamp > duration;
}

// 新增一個顯示錯誤的函數
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    currencyList.innerHTML = '';
    currencyList.appendChild(errorDiv);
}

// 在初始化函數中設置語言
async function initialize() {
    await loadCurrencyConfig();
    if (!currencyConfig) {
        throw new Error('Failed to load currency config');
    }
    await loadUserSettings();
    applyLanguage(currentLanguage);
    await initCurrencyList();
    initSortable();
    updateDeleteButtons();
    populateAllCurrencies(); // 確保所有貨幣列表在初始化時被填充
    initSettingsUI();
}

// 初始化
document.addEventListener('DOMContentLoaded', async function() {
    await initialize();
    await loadCurrencyConfig();
    if (!currencyConfig) {
        throw new Error('Failed to load currency config');
    }

    await updateExchangeRates();
    await initCurrencyList();
    initSortable();
    updateDeleteButtons();
    updateAllAmounts(lastEditedAmount, lastEditedCurrency);

    // 設置定時更新匯率
    setInterval(updateExchangeRates, 60000); // 每分鐘更新次

    // 檢查當前是否為彈出視窗
    chrome.windows.getCurrent((window) => {
        isPopupWindow = window.type === 'popup';
        if (isPopupWindow) {
            document.body.classList.add('popup-window');
            // 隱藏彈窗按鈕
            popupWindowButton.style.display = 'none';
        }
    });

    // 彈出視窗按鈕
    popupWindowButton.addEventListener('click', () => {
        chrome.windows.create({
            url: chrome.runtime.getURL("popup.html"),
            type: "popup",
            width: 380,
            height: 480
        }, (window) => {
            chrome.windows.update(window.id, {
                left: Math.round((screen.width - 380) / 2),
                top: Math.round((screen.height - 480) / 2)
            });
        });
    });

    // 設定按鈕事件
    openSettingsButton.addEventListener('click', () => {
        mainView.style.display = 'none';
        settingsView.style.display = 'flex';
    });

    // 返回按鈕事件
    backButton.addEventListener('click', () => {
        settingsView.style.display = 'none';
        mainView.style.display = 'flex';
    });

    // 添加貨幣按鈕
    addCurrencyButton.addEventListener('click', () => {
        currencyModal.style.display = 'block';
        populateAllCurrencies(); // 確保列表是最新的
        // 將焦點移到搜索輸入框
        currencySearch.focus();
    });

    // 關閉模態框
    currencyModal.addEventListener('click', (e) => {
        if (e.target === currencyModal) {
            currencyModal.style.display = 'none';
        }
    });

    // 關閉按鈕
    closeModalButton.addEventListener('click', () => {
        currencyModal.style.display = 'none';
    });

    // 搜索功能
    const clearSearchButton = document.getElementById('clear-search');
    
    if (currencySearch && clearSearchButton) {
        currencySearch.addEventListener('input', (e) => {
            currentSearchTerm = e.target.value;
            clearSearchButton.style.display = currentSearchTerm ? 'flex' : 'none';
            populateAllCurrencies();
        });

        clearSearchButton.addEventListener('click', () => {
            currencySearch.value = '';
            currentSearchTerm = '';
            clearSearchButton.style.display = 'none';
            populateAllCurrencies();
            // 將焦點重新聚焦到搜索輸入框
            currencySearch.focus();
        });
    } else {
        //console.error('Currency search input or clear button not found');
    }

    // 根據視窗類型調整佈局
    if (isPopupWindow) {
        document.body.style.width = '100%';
        document.body.style.height = '100vh';
    }

    document.querySelectorAll('.amount-input').forEach(input => {
        input.addEventListener('keydown', handleAmountKeydown);
    });
});

// 更新所有金額
function updateAllAmounts(amount, fromCurrency) {
    const items = document.querySelectorAll('.currency-item');
    items.forEach(item => {
        const currency = item.dataset.currency;
        const input = item.querySelector('.amount-input');
        
        // 如果這個輸入框正在被編輯且包含運算符，保留其原始值
        if (input.classList.contains('last-edited') && /[+\-*/]/.test(input.value)) {
            return;
        }
        
        if (currency === fromCurrency) {
            updateCurrencyAmount(currency, amount);
        } else {
            const convertedAmount = convert(amount, fromCurrency, currency);
            updateCurrencyAmount(currency, convertedAmount);
        }
    });
    updateDeleteButtons();
}
