'use client'

import { useState, useEffect } from 'react'
import { RefreshCw, ArrowRightLeft } from 'lucide-react'

// Exchange rates relative to PHP (updated periodically)
// In production, you'd fetch these from an API
const EXCHANGE_RATES: Record<string, { rate: number; symbol: string; name: string }> = {
  PHP: { rate: 1, symbol: '₱', name: 'Philippine Peso' },
  USD: { rate: 56.5, symbol: '$', name: 'US Dollar' },
  EUR: { rate: 61.2, symbol: '€', name: 'Euro' },
  GBP: { rate: 71.5, symbol: '£', name: 'British Pound' },
  JPY: { rate: 0.38, symbol: '¥', name: 'Japanese Yen' },
  KRW: { rate: 0.042, symbol: '₩', name: 'South Korean Won' },
  SGD: { rate: 42.1, symbol: 'S$', name: 'Singapore Dollar' },
  AUD: { rate: 36.8, symbol: 'A$', name: 'Australian Dollar' },
  CNY: { rate: 7.85, symbol: '¥', name: 'Chinese Yuan' },
  HKD: { rate: 7.22, symbol: 'HK$', name: 'Hong Kong Dollar' },
  THB: { rate: 1.58, symbol: '฿', name: 'Thai Baht' },
  MYR: { rate: 12.1, symbol: 'RM', name: 'Malaysian Ringgit' },
}

interface CurrencyConverterProps {
  defaultFrom?: string
  defaultTo?: string
  compact?: boolean
}

export default function CurrencyConverter({
  defaultFrom = 'USD',
  defaultTo = 'PHP',
  compact = false,
}: CurrencyConverterProps) {
  const [amount, setAmount] = useState<string>('100')
  const [fromCurrency, setFromCurrency] = useState(defaultFrom)
  const [toCurrency, setToCurrency] = useState(defaultTo)
  const [result, setResult] = useState<number>(0)

  useEffect(() => {
    calculateConversion()
  }, [amount, fromCurrency, toCurrency])

  const calculateConversion = () => {
    const amountNum = parseFloat(amount) || 0
    const fromRate = EXCHANGE_RATES[fromCurrency]?.rate || 1
    const toRate = EXCHANGE_RATES[toCurrency]?.rate || 1

    // Convert to PHP first, then to target currency
    const inPhp = amountNum * fromRate
    const converted = inPhp / toRate

    setResult(converted)
  }

  const swapCurrencies = () => {
    setFromCurrency(toCurrency)
    setToCurrency(fromCurrency)
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return num.toLocaleString(undefined, { maximumFractionDigits: 0 })
    }
    return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  if (compact) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
        <div className="flex items-center gap-2 mb-3">
          <RefreshCw className="w-4 h-4 text-teal-600" />
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            Currency Converter
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex-1">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-gray-100 dark:bg-gray-800 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <select
            value={fromCurrency}
            onChange={(e) => setFromCurrency(e.target.value)}
            className="px-2 py-2 text-sm bg-gray-100 dark:bg-gray-800 rounded-lg border-0"
          >
            {Object.keys(EXCHANGE_RATES).map((curr) => (
              <option key={curr} value={curr}>{curr}</option>
            ))}
          </select>
          <button
            onClick={swapCurrencies}
            className="p-2 text-gray-400 hover:text-teal-600"
          >
            <ArrowRightLeft className="w-4 h-4" />
          </button>
          <select
            value={toCurrency}
            onChange={(e) => setToCurrency(e.target.value)}
            className="px-2 py-2 text-sm bg-gray-100 dark:bg-gray-800 rounded-lg border-0"
          >
            {Object.keys(EXCHANGE_RATES).map((curr) => (
              <option key={curr} value={curr}>{curr}</option>
            ))}
          </select>
        </div>

        <div className="mt-3 text-center">
          <span className="text-2xl font-bold text-teal-600 dark:text-teal-400">
            {EXCHANGE_RATES[toCurrency]?.symbol}{formatNumber(result)}
          </span>
          <span className="text-sm text-gray-500 ml-2">{toCurrency}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-500 to-blue-600 px-4 py-4">
        <div className="flex items-center gap-2 text-white">
          <RefreshCw className="w-5 h-5" />
          <h3 className="font-semibold">Currency Converter</h3>
        </div>
        <p className="text-teal-100 text-sm mt-1">
          Convert between PHP and other currencies
        </p>
      </div>

      <div className="p-4 space-y-4">
        {/* From currency */}
        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">
            From
          </label>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                {EXCHANGE_RATES[fromCurrency]?.symbol}
              </span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-8 pr-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-lg border-0 text-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <select
              value={fromCurrency}
              onChange={(e) => setFromCurrency(e.target.value)}
              className="px-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-lg border-0 font-medium"
            >
              {Object.entries(EXCHANGE_RATES).map(([code, { name }]) => (
                <option key={code} value={code}>
                  {code} - {name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Swap button */}
        <div className="flex justify-center">
          <button
            onClick={swapCurrencies}
            className="p-3 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <ArrowRightLeft className="w-5 h-5 text-gray-600 dark:text-gray-400 rotate-90" />
          </button>
        </div>

        {/* To currency */}
        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">
            To
          </label>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                {EXCHANGE_RATES[toCurrency]?.symbol}
              </span>
              <input
                type="text"
                value={formatNumber(result)}
                readOnly
                className="w-full pl-8 pr-4 py-3 bg-teal-50 dark:bg-teal-900/20 rounded-lg border-0 text-lg text-teal-700 dark:text-teal-400 font-semibold"
              />
            </div>
            <select
              value={toCurrency}
              onChange={(e) => setToCurrency(e.target.value)}
              className="px-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-lg border-0 font-medium"
            >
              {Object.entries(EXCHANGE_RATES).map(([code, { name }]) => (
                <option key={code} value={code}>
                  {code} - {name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Exchange rate info */}
        <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            1 {fromCurrency} = {EXCHANGE_RATES[toCurrency]?.symbol}
            {formatNumber(EXCHANGE_RATES[fromCurrency]?.rate / EXCHANGE_RATES[toCurrency]?.rate)} {toCurrency}
          </p>
          <p className="text-xs text-gray-400 text-center mt-1">
            Rates are approximate and for reference only
          </p>
        </div>
      </div>
    </div>
  )
}
