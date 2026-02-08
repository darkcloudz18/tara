'use client'

import { useState, useEffect } from 'react'
import {
  FileText,
  Plane,
  Building2,
  CreditCard,
  Shield,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Lock,
} from 'lucide-react'
import { useToast } from '@/contexts/ToastContext'

type DocumentType = 'passport' | 'flight' | 'hotel' | 'insurance' | 'other'

interface Document {
  id: string
  type: DocumentType
  title: string
  details: Record<string, string>
  notes?: string
  createdAt: string
}

const DOCUMENT_CONFIG: Record<DocumentType, {
  label: string
  icon: React.ReactNode
  fields: { key: string; label: string; sensitive?: boolean }[]
}> = {
  passport: {
    label: 'Passport / ID',
    icon: <FileText className="w-5 h-5" />,
    fields: [
      { key: 'name', label: 'Full Name' },
      { key: 'number', label: 'Passport/ID Number', sensitive: true },
      { key: 'expiry', label: 'Expiry Date' },
      { key: 'nationality', label: 'Nationality' },
    ],
  },
  flight: {
    label: 'Flight Booking',
    icon: <Plane className="w-5 h-5" />,
    fields: [
      { key: 'confirmationCode', label: 'Confirmation Code', sensitive: true },
      { key: 'airline', label: 'Airline' },
      { key: 'flightNumber', label: 'Flight Number' },
      { key: 'departure', label: 'Departure' },
      { key: 'arrival', label: 'Arrival' },
      { key: 'date', label: 'Date & Time' },
    ],
  },
  hotel: {
    label: 'Hotel Booking',
    icon: <Building2 className="w-5 h-5" />,
    fields: [
      { key: 'confirmationCode', label: 'Confirmation Code', sensitive: true },
      { key: 'hotelName', label: 'Hotel Name' },
      { key: 'address', label: 'Address' },
      { key: 'checkIn', label: 'Check-in' },
      { key: 'checkOut', label: 'Check-out' },
      { key: 'contact', label: 'Contact Number' },
    ],
  },
  insurance: {
    label: 'Travel Insurance',
    icon: <Shield className="w-5 h-5" />,
    fields: [
      { key: 'policyNumber', label: 'Policy Number', sensitive: true },
      { key: 'provider', label: 'Insurance Provider' },
      { key: 'coverage', label: 'Coverage Period' },
      { key: 'emergencyContact', label: 'Emergency Contact' },
    ],
  },
  other: {
    label: 'Other Document',
    icon: <CreditCard className="w-5 h-5" />,
    fields: [
      { key: 'title', label: 'Title' },
      { key: 'reference', label: 'Reference Number' },
      { key: 'details', label: 'Details' },
    ],
  },
}

interface DocumentVaultProps {
  tripId?: string
}

export default function DocumentVault({ tripId }: DocumentVaultProps) {
  const { success } = useToast()
  const [documents, setDocuments] = useState<Document[]>([])
  const [expandedDocs, setExpandedDocs] = useState<string[]>([])
  const [showSensitive, setShowSensitive] = useState<Record<string, boolean>>({})
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newDocType, setNewDocType] = useState<DocumentType>('passport')
  const [newDocDetails, setNewDocDetails] = useState<Record<string, string>>({})
  const [newDocNotes, setNewDocNotes] = useState('')

  // Load documents from localStorage
  useEffect(() => {
    const storageKey = `documents-${tripId || 'default'}`
    const saved = localStorage.getItem(storageKey)
    if (saved) {
      setDocuments(JSON.parse(saved))
    }
  }, [tripId])

  // Save to localStorage
  useEffect(() => {
    const storageKey = `documents-${tripId || 'default'}`
    localStorage.setItem(storageKey, JSON.stringify(documents))
  }, [documents, tripId])

  const toggleExpanded = (docId: string) => {
    setExpandedDocs((prev) =>
      prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId]
    )
  }

  const toggleSensitive = (fieldKey: string) => {
    setShowSensitive((prev) => ({
      ...prev,
      [fieldKey]: !prev[fieldKey],
    }))
  }

  const copyToClipboard = async (text: string, fieldKey: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedField(fieldKey)
    success('Copied to clipboard')
    setTimeout(() => setCopiedField(null), 2000)
  }

  const addDocument = () => {
    const config = DOCUMENT_CONFIG[newDocType]
    const title = newDocDetails.name || newDocDetails.hotelName || newDocDetails.airline || newDocDetails.title || config.label

    const newDoc: Document = {
      id: `doc-${Date.now()}`,
      type: newDocType,
      title,
      details: { ...newDocDetails },
      notes: newDocNotes || undefined,
      createdAt: new Date().toISOString(),
    }

    setDocuments((prev) => [...prev, newDoc])
    setShowAddModal(false)
    setNewDocDetails({})
    setNewDocNotes('')
    success('Document saved')
  }

  const deleteDocument = (docId: string) => {
    setDocuments((prev) => prev.filter((doc) => doc.id !== docId))
    success('Document deleted')
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
      {/* Header */}
      <div className="px-4 py-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Document Vault
            </h3>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Securely store your travel documents (stored locally on device)
        </p>
      </div>

      {/* Documents list */}
      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {documents.length === 0 ? (
          <div className="py-12 text-center">
            <Lock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">No documents saved yet</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-3 text-teal-600 dark:text-teal-400 text-sm hover:underline"
            >
              Add your first document
            </button>
          </div>
        ) : (
          documents.map((doc) => {
            const config = DOCUMENT_CONFIG[doc.type]
            const isExpanded = expandedDocs.includes(doc.id)

            return (
              <div key={doc.id}>
                <button
                  onClick={() => toggleExpanded(doc.id)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-teal-100 dark:bg-teal-900/30 rounded-lg flex items-center justify-center text-teal-600 dark:text-teal-400">
                      {config.icon}
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {doc.title}
                      </p>
                      <p className="text-xs text-gray-500">{config.label}</p>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 space-y-3">
                    {config.fields.map((field) => {
                      const value = doc.details[field.key]
                      if (!value) return null

                      const fieldKey = `${doc.id}-${field.key}`
                      const isVisible = showSensitive[fieldKey]
                      const isCopied = copiedField === fieldKey

                      return (
                        <div key={field.key} className="flex items-center gap-2">
                          <div className="flex-1">
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {field.label}
                            </p>
                            <p className="text-sm text-gray-900 dark:text-white font-mono">
                              {field.sensitive && !isVisible
                                ? '••••••••'
                                : value}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            {field.sensitive && (
                              <button
                                onClick={() => toggleSensitive(fieldKey)}
                                className="p-1.5 text-gray-400 hover:text-gray-600 rounded"
                              >
                                {isVisible ? (
                                  <EyeOff className="w-4 h-4" />
                                ) : (
                                  <Eye className="w-4 h-4" />
                                )}
                              </button>
                            )}
                            <button
                              onClick={() => copyToClipboard(value, fieldKey)}
                              className="p-1.5 text-gray-400 hover:text-teal-600 rounded"
                            >
                              {isCopied ? (
                                <Check className="w-4 h-4 text-teal-600" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      )
                    })}

                    {doc.notes && (
                      <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                        <p className="text-xs text-gray-500">Notes</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {doc.notes}
                        </p>
                      </div>
                    )}

                    <button
                      onClick={() => deleteDocument(doc.id)}
                      className="flex items-center gap-1 text-sm text-red-600 hover:underline mt-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete document
                    </button>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Add Document Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md mx-4 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Add Document
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Document type selector */}
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Document Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(DOCUMENT_CONFIG) as DocumentType[]).map((type) => (
                    <button
                      key={type}
                      onClick={() => {
                        setNewDocType(type)
                        setNewDocDetails({})
                      }}
                      className={`flex items-center gap-2 p-3 rounded-lg border-2 text-left ${
                        newDocType === type
                          ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20'
                          : 'border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <span className="text-teal-600 dark:text-teal-400">
                        {DOCUMENT_CONFIG[type].icon}
                      </span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {DOCUMENT_CONFIG[type].label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Fields */}
              {DOCUMENT_CONFIG[newDocType].fields.map((field) => (
                <div key={field.key}>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                    {field.label}
                  </label>
                  <input
                    type={field.sensitive ? 'text' : 'text'}
                    value={newDocDetails[field.key] || ''}
                    onChange={(e) =>
                      setNewDocDetails((prev) => ({
                        ...prev,
                        [field.key]: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              ))}

              {/* Notes */}
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                  Notes (optional)
                </label>
                <textarea
                  value={newDocNotes}
                  onChange={(e) => setNewDocNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={addDocument}
                className="flex-1 px-4 py-2 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700"
              >
                Save Document
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
