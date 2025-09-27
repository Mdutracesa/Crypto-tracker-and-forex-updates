// API Configuration
const API_URL = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=5&page=1&sparkline=true&price_change_percentage=24h';
const GLOBAL_DATA_URL = 'https://api.coingecko.com/api/v3/global';

// DOM Elements
const cryptoTable = document.getElementById('cryptoTable');
const watchlist = document.getElementById('watchlist');
const refreshBtn = document.getElementById('refreshData');
const totalMarketCap = document.getElementById('totalMarketCap');
const totalVolume = document.getElementById('totalVolume');
const btcDominance = document.getElementById('btcDominance');
const marketSentiment = document.getElementById('marketSentiment');

// Format currency
function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: value < 1 ? 4 : 2,
        maximumFractionDigits: value < 1 ? 4 : 2
    }).format(value);
}

// Format large numbers
function formatLargeNumber(value) {
    if (value >= 1e12) {
        return '$' + (value / 1e12).toFixed(2) + 'T';
    } else if (value >= 1e9) {
        return '$' + (value / 1e9).toFixed(2) + 'B';
    } else if (value >= 1e6) {
        return '$' + (value / 1e6).toFixed(2) + 'M';
    } else {
        return '$' + value.toFixed(2);
    }
}

// Format percentage
function formatPercentage(value) {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
}

// Generate sparkline chart
function generateSparkline(sparklineData) {
    if (!sparklineData || sparklineData.length === 0) return '';

    const max = Math.max(...sparklineData);
    const min = Math.min(...sparklineData);
    const range = max - min;

    if (range === 0) return '<div class="chart-container"><div class="chart"><div class="chart-bar" style="height: 50%"></div></div></div>';

    let chartHTML = '<div class="chart-container"><div class="chart">';

    // Take a sample of points for the sparkline (max 20 points)
    const step = Math.ceil(sparklineData.length / 20);
    for (let i = 0; i < sparklineData.length; i += step) {
        const height = ((sparklineData[i] - min) / range) * 100;
        chartHTML += `<div class="chart-bar" style="height: ${height}%"></div>`;
    }

    chartHTML += '</div></div>';
    return chartHTML;
}

// Fetch cryptocurrency data
async function fetchCryptoData() {
    try {
        cryptoTable.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Loading cryptocurrency data...</div>';

        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Failed to fetch data');

        const data = await response.json();
        displayCryptoData(data);
    } catch (error) {
        console.error('Error fetching crypto data:', error);
        cryptoTable.innerHTML = `<div class="error"><i class="fas fa-exclamation-triangle"></i> Failed to load data: ${error.message}</div>`;
    }
}

// Fetch global market data
async function fetchGlobalData() {
    try {
        const response = await fetch(GLOBAL_DATA_URL);
        if (!response.ok) throw new Error('Failed to fetch global data');

        const data = await response.json();
        displayGlobalData(data);
    } catch (error) {
        console.error('Error fetching global data:', error);
        totalMarketCap.textContent = 'N/A';
        totalVolume.textContent = 'N/A';
        btcDominance.textContent = 'N/A';
        marketSentiment.textContent = 'N/A';
    }
}

// Display cryptocurrency data
function displayCryptoData(data) {
    let tableHTML = `
        <table>
            <thead>
                <tr>
                    <th>#</th>
                    <th>Coin</th>
                    <th>Price</th>
                    <th>24h Change</th>
                    <th>Market Cap</th>
                    <th>Last 7 Days</th>
                </tr>
            </thead>
            <tbody>
    `;

    data.forEach((coin, index) => {
        const changeClass = coin.price_change_percentage_24h >= 0 ? 'positive' : 'negative';
        const changePercentage = formatPercentage(coin.price_change_percentage_24h || 0);

        tableHTML += `
            <tr>
                <td>${index + 1}</td>
                <td>
                    <div class="coin-info">
                        <img src="${coin.image}" alt="${coin.name}" width="24" height="24" style="border-radius: 50%;">
                        <div>${coin.name} (${coin.symbol.toUpperCase()})</div>
                    </div>
                </td>
                <td>${formatCurrency(coin.current_price)}</td>
                <td class="${changeClass}">${changePercentage}</td>
                <td>${formatLargeNumber(coin.market_cap)}</td>
                <td>${generateSparkline(coin.sparkline_in_7d?.price)}</td>
            </tr>
        `;
    });

    tableHTML += '</tbody></table>';
    cryptoTable.innerHTML = tableHTML;

    updateWatchlist(data);
}

// Display global market data
function displayGlobalData(data) {
    const globalData = data.data;

    totalMarketCap.textContent = formatLargeNumber(globalData.total_market_cap.usd);
    totalVolume.textContent = formatLargeNumber(globalData.total_volume.usd);
    btcDominance.textContent = globalData.market_cap_percentage.btc.toFixed(1) + '%';

    const sentiment = globalData.market_cap_percentage.btc > 40 ? 'Bullish' : 'Neutral';
    marketSentiment.textContent = sentiment;
}

// Update watchlist
function updateWatchlist(data) {
    let watchlistHTML = '';
    data.forEach(coin => {
        watchlistHTML += `
            <div class="watchlist-item">
                <div class="watchlist-coin">
                    <img src="${coin.image}" alt="${coin.name}" width="20" height="20" style="border-radius: 50%;">
                    <span>${coin.name} (${coin.symbol.toUpperCase()})</span>
                </div>
                <div>${formatCurrency(coin.current_price)}</div>
            </div>
        `;
    });
    watchlist.innerHTML = watchlistHTML;
}

// Refresh button
if (refreshBtn) {
    refreshBtn.addEventListener('click', fetchCryptoData);
}

// Initialize
// Initialize
if (cryptoTable) {
  fetchCryptoData();
  fetchGlobalData();
}
