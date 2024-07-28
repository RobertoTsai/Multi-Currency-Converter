// 定期更新匯率
function updateExchangeRates() {
    fetch('https://api.exchangerate-api.com/v4/latest/USD')
        .then(response => response.json())
        .then(data => {
            chrome.storage.local.set({ exchangeRates: data.rates });
        })
        .catch(error => console.error('Failed to fetch exchange rates:', error));
}

// 初次安裝或更新時更新匯率
chrome.runtime.onInstalled.addListener(() => {
    updateExchangeRates();
});

// 每小時更新一次匯率
chrome.alarms.create('updateRates', { periodInMinutes: 60 });

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'updateRates') {
        updateExchangeRates();
    }
});
