const currencyList = document.getElementById('currency-list');
const popupWindowButton = document.getElementById('popup-window');
const addCurrencyButton = document.getElementById('add-currency');
const currencyModal = document.getElementById('currency-modal');
const currencySearch = document.getElementById('currency-search');
const allCurrenciesList = document.getElementById('all-currencies');
const closeModalButton = document.getElementById('close-modal');

const defaultCurrencies = ['USD', 'EUR', 'JPY', 'TWD', 'BTC', 'ETH'];
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds
const CURRENCY_INFO_CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7天的毫秒數
let currentLanguage = 'en'; 
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

//取得用戶語言設定
async function getUserLanguage() {
    return new Promise((resolve) => {
        chrome.storage.sync.get('userLanguage', function(result) {
            if (result.userLanguage) {
                resolve(result.userLanguage);
            } else {
                // 如果沒有設置，使用瀏覽器的語言
                const browserLang = navigator.language || navigator.userLanguage;
                if (browserLang.startsWith('zh')) {
                    if (browserLang === 'zh-TW' || browserLang === 'zh-HK') {
                        resolve('zh-TW');
                    } else {
                        resolve('zh-CN');
                    }
                } else {
                    resolve('en');
                }
            }
        });
    });
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
        
        // 先顯示幣別列表，使用骨架屏效果
        currencies.forEach(currency => {
            const item = addCurrencyItem(currency);
            item.classList.add('skeleton'); // 添加骨架屏類
        });
        
        // 嘗試使用快取的匯率
        const cachedRates = await getFromCache('exchangeRates');
        if (cachedRates && !isCacheExpired(cachedRates.timestamp)) {
            fiatRates = cachedRates.data.fiatRates;
            cryptoRates = cachedRates.data.cryptoRates;
            btcToUsd = cachedRates.data.btcToUsd;
            updateAllAmounts(lastEditedAmount, lastEditedCurrency);
        }
        
        // 非同步獲取最新匯率
        updateExchangeRates().then(() => {
            // 更新金額並移除骨架屏效果
            updateAllAmounts(lastEditedAmount, lastEditedCurrency);
            document.querySelectorAll('.currency-item').forEach(item => {
                item.classList.remove('skeleton');
            });
        });
        
        //console.log('Currency list initialized');
    } catch (error) {
        //console.error('Error initializing currency list:', error);
        showError('Failed to initialize currency list. Please try again.');
    }
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
        <button class="delete-button" title="刪除"><i class="fas fa-times"></i></button>
    `;

    const input = item.querySelector('.amount-input');
    input.addEventListener('input', handleAmountInput);
    input.addEventListener('focus', handleAmountFocus);
    input.addEventListener('blur', handleAmountBlur);

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

// 刪除貨幣項目
function deleteCurrencyItem(item) {
    if (currencyList.children.length > 1) {
        item.remove();
        saveOrder();
        updateDeleteButtons();
        updateExchangeRates(); // 重新計算匯率
    }
}

// 更新刪除按鈕狀態
function updateDeleteButtons() {
    const deleteButtons = document.querySelectorAll('.delete-button');
    const isDisabled = currencyList.children.length <= 1;
    deleteButtons.forEach(button => {
        button.classList.toggle('disabled', isDisabled);
        button.disabled = isDisabled;
    });
}

// 處理金額輸入
function handleAmountInput(event) {
    const input = event.target;
    const cursorPosition = input.selectionStart;
    const oldValue = input.value;
    let newValue = oldValue.replace(/,/g, '');
    
    // 只允許數字和一個小數點
    newValue = newValue.replace(/[^\d.]/g, '');
    const parts = newValue.split('.');
    if (parts.length > 2) {
        parts.pop();
        newValue = parts.join('.');
    }

    if (newValue !== '') {
        const amount = parseFloat(newValue);
        if (!isNaN(amount)) {
            lastEditedAmount = amount;
            lastEditedCurrency = input.dataset.currency;
            input.classList.add('last-edited');
            
            // 添加 active-input 類到當前輸入項目
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
            newValue = formatUserInput(newValue);
            updateAllAmounts(amount, input.dataset.currency);
            saveLastInput(); // 保存用戶的輸入
        }
    }

    input.value = newValue;

    // 調整光標位置
    const addedCommas = (newValue.match(/,/g) || []).length - (oldValue.match(/,/g) || []).length;
    const newPosition = cursorPosition + addedCommas;
    input.setSelectionRange(newPosition, newPosition);
}

// 處理金額輸入框獲得焦點
function handleAmountFocus(event) {
    event.target.select();
    // 添加 active-input 類到當前輸入項目
    document.querySelectorAll('.currency-item').forEach(item => {
        if (item.contains(event.target)) {
            item.classList.add('active-input');
        } else {
            item.classList.remove('active-input');
        }
    });
}

// 更新所有金額
function updateAllAmounts(amount, fromCurrency) {
    const items = document.querySelectorAll('.currency-item');
    items.forEach(item => {
        const currency = item.dataset.currency;
        if (currency === fromCurrency) {
            updateCurrencyAmount(currency, amount);
        } else {
            const convertedAmount = convert(amount, fromCurrency, currency);
            updateCurrencyAmount(currency, convertedAmount);
        }
    });
    updateDeleteButtons();
}

// 處理金額輸入框失去焦點
function handleAmountBlur(event) {
    const input = event.target;
    const amount = parseFormattedNumber(input.value);
    if (isNaN(amount) || amount === 0) {
        input.value = formatConversionResult(0);
    } else {
        input.value = formatConversionResult(amount);
    }
    // 移除 active-input 類
    input.closest('.currency-item').classList.remove('active-input');
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

// 更新匯率
async function updateExchangeRates() {
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

// 新增处理用户输入的格式化函数
function formatUserInput(num) {
    // 移除除了数字和小数点以外的所有字符
    let cleanNum = num.toString().replace(/[^\d.]/g, '');
    
    // 确保只有一个小数点
    let parts = cleanNum.split('.');
    if (parts.length > 2) {
        parts = [parts[0], parts.slice(1).join('')];
    }
    cleanNum = parts.join('.');

    // 添加千位分隔符到整数部分
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');

    return parts.join('.');
}

// 新增处理转换结果的格式化函数
function formatConversionResult(num) {
    // 將輸入轉換為數字
    const number = Number(num);
    
    // 如果數字為 0，直接返回 "0.00"
    if (number === 0) {
        return "0.00";
    }

    // 處理非常小的數字
    if (Math.abs(number) < 0.01) {
        let precision = 2;
        while (Number(Math.abs(number).toFixed(precision)) === 0 && precision < 8) {
            precision++;
        }
        let formattedNum = Math.abs(number).toFixed(precision);
        // 移除尾部的 0
        formattedNum = formattedNum.replace(/\.?0+$/, "");
        
        // 如果小數點後沒有數字，添加 ".00"
        if (!formattedNum.includes('.')) {
            formattedNum += '.00';
        } else if (formattedNum.split('.')[1].length === 1) {
            // 如果只有一位小數，添加一個 0
            formattedNum += '0';
        }
        
        return number < 0 ? "-" + formattedNum : formattedNum;
    }

    // 對於正常範圍的數字，保持兩位小數
    let formattedNum = Math.abs(number).toFixed(2);

    // 分割整數部分和小數部分
    let [integerPart, decimalPart] = formattedNum.split('.');
    
    // 添加千位分隔符到整數部分
    integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

    // 組合結果
    let result = integerPart + '.' + decimalPart;

    // 如果原數字是負數，添加負號
    if (number < 0) {
        result = '-' + result;
    }

    return result;
}

// 解析可能包含千分位分隔符的數字字符串
function parseFormattedNumber(str) {
    return parseFloat(str.replace(/,/g, ''));
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

// 檢查快取是否過期（這裡設置為 1 小時）
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
    currentLanguage = await getUserLanguage();
    await loadCurrencyConfig();
    if (!currencyConfig) {
        throw new Error('Failed to load currency config');
    }
    await initCurrencyList();
    initSortable();
    updateDeleteButtons();
    populateAllCurrencies(); // 確保所有貨幣列表在初始化時被填充
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
    setInterval(updateExchangeRates, 60000); // 每分鐘更新一次

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
            clearSearchButton.style.display = currentSearchTerm ? 'block' : 'none';
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
});