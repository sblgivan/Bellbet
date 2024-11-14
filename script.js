import { deriv } from 'https://cdn.jsdelivr.net/npm/@deriv/api/dist/index.min.js';

// Initialize the Deriv API with your token
deriv.setSettings({ apiToken: 'pfm6nudgLi4aNys' });

// Get references to the UI elements
const symbolInput = document.getElementById('symbol');
const amountInput = document.getElementById('amount');
const durationInput = document.getElementById('duration');
const buyCallButton = document.getElementById('buy-call');
const buyPutButton = document.getElementById('buy-put');
const tradeHistoryList = document.getElementById('trade-history');
const statusDisplay = document.getElementById('status');

// Function to fetch the latest market prices
async function getMarketPrices(symbol) {
  try {
    const response = await deriv.getTicksHistory({
      symbol,
      count: 10,
      granularity: 60, // 1-minute candles
    });
    return response.prices;
  } catch (error) {
    console.error('Error fetching market prices:', error);
    return [];
  }
}

// Function to analyze the market data and determine the best trade
async function analyzeTrade(symbol) {
  const prices = await getMarketPrices(symbol);
  if (prices.length < 10) {
    return { type: null, confidence: 0 };
  }

  // Implement your own trading strategy here
  const lastPrice = prices[prices.length - 1].close;
  const secondLastPrice = prices[prices.length - 2].close;
  if (lastPrice > secondLastPrice) {
    return { type: 'call', confidence: 0.7 };
  } else {
    return { type: 'put', confidence: 0.7 };
  }
}

// Function to place a trade
async function placeTrade(type, symbol, amount, duration) {
  try {
    const response = await deriv.buy({
      amount,
      contract_type: type,
      duration,
      symbol,
    });

    console.log('Trade placed successfully:', response);
    updateTradeHistory(type, symbol, amount, duration, response.buy.reference);
    updateStatus(`Trade placed (${type}): ${symbol} (${amount}, ${duration})`);
  } catch (error) {
    console.error('Error placing trade:', error);
    updateStatus('Error placing trade');
  }
}

// Function to update the trade history
function updateTradeHistory(type, symbol, amount, duration, reference) {
  const listItem = document.createElement('li');
  listItem.textContent = `${type} ${symbol} (${amount}, ${duration}) - Reference: ${reference}`;
  tradeHistoryList.appendChild(listItem);
}

// Function to update the status display
function updateStatus(message) {
  statusDisplay.textContent = message;
}

// Function to execute trades based on analysis
async function executeTrades() {
  const symbol = symbolInput.value;
  const amount = parseFloat(amountInput.value);
  const duration = parseInt(durationInput.value);

  const { type, confidence } = await analyzeTrade(symbol);
  if (type && confidence > 0.5) {
    if (type === 'call') {
      await placeTrade('call', symbol, amount, duration);
    } else {
      await placeTrade('put', symbol, amount, duration);
    }
  } else {
    updateStatus('No trade recommendation');
  }
}

// Add event listeners to the buttons
buyCallButton.addEventListener('click', executeTrades);
buyPutButton.addEventListener('click', executeTrades);

// Set up periodic trade execution
setInterval(executeTrades, 60000); // Execute trades every minute
