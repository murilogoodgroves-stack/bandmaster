import React, { useState, useMemo } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import type { Invoice, Transaction, BandSettings } from '../types';
import { initialInvoices, initialTransactions, initialBandSettings } from '../data/initialData';
import { DownloadIcon, EyeIcon } from './icons';

const InvoiceDetailModal: React.FC<{ invoice: Invoice, onClose: () => void, bandSettings: BandSettings }> = ({ invoice, onClose, bandSettings }) => {
    const showNotification = (message: string) => {
        // A real implementation would show a toast notification
        alert(message);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-4xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">Invoice #{invoice.invoiceNumber}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">&times;</button>
                </div>
                <div className="flex-grow bg-gray-900/50 p-6 rounded-lg overflow-y-auto">
                    {/* Header */}
                    <div className="grid grid-cols-2 gap-8 mb-8">
                        <div>
                            <h3 className="font-bold text-lg">{bandSettings.issuerName}</h3>
                            <p className="text-sm text-gray-400 whitespace-pre-wrap">{bandSettings.issuerAddress}</p>
                            <p className="text-sm text-gray-400">Tax ID: {bandSettings.issuerTaxId}</p>
                        </div>
                        <div className="text-right">
                            <h3 className="text-3xl font-bold uppercase text-gray-400">Invoice</h3>
                            <p className="text-sm">Invoice #: <span className="font-semibold">{invoice.invoiceNumber}</span></p>
                            <p className="text-sm">Date: <span className="font-semibold">{new Date(invoice.invoiceDate).toLocaleDateString()}</span></p>
                            <p className="text-sm">Due: <span className="font-semibold">{new Date(invoice.dueDate).toLocaleDateString()}</span></p>
                        </div>
                    </div>
                    {/* Bill To */}
                    <div className="mb-8">
                        <h4 className="text-sm text-gray-400">Bill To:</h4>
                        <p className="font-bold text-lg">{invoice.recipient.name}</p>
                        <p className="text-sm text-gray-300 whitespace-pre-wrap">{invoice.recipient.address}</p>
                    </div>
                    {/* Items Table */}
                    <table className="w-full text-left mb-8">
                        <thead className="bg-gray-700/50">
                            <tr>
                                <th className="p-2">Description</th>
                                <th className="p-2 text-right">Qty</th>
                                <th className="p-2 text-right">Unit Price</th>
                                <th className="p-2 text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoice.items.map((item, i) => (
                                <tr key={i} className="border-b border-gray-700">
                                    <td className="p-2">{item.description}</td>
                                    <td className="p-2 text-right">{item.quantity}</td>
                                    <td className="p-2 text-right">${item.unitPrice.toFixed(2)}</td>
                                    <td className="p-2 text-right">${(item.quantity * item.unitPrice).toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {/* Total */}
                    <div className="text-right">
                        <p className="text-sm text-gray-400">Total</p>
                        <p className="text-3xl font-bold">${invoice.total.toFixed(2)}</p>
                    </div>
                    {/* Notes & Bank Details */}
                    <div className="mt-12 pt-6 border-t border-gray-700 grid grid-cols-2 gap-8 text-sm">
                        <div>
                            <h4 className="font-bold mb-2">Notes</h4>
                            <p className="text-gray-400">{invoice.notes || 'Thank you for your business!'}</p>
                        </div>
                        <div>
                            <h4 className="font-bold mb-2">Payment Details</h4>
                            <p className="text-gray-400 whitespace-pre-wrap">{bandSettings.issuerBankDetails}</p>
                        </div>
                    </div>
                </div>
                <div className="mt-4 flex justify-end">
                     <button onClick={() => showNotification('In a real app, this would download a PDF of the invoice.')} className="flex items-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">
                        <DownloadIcon className="h-5 w-5 mr-2" />
                        Download PDF
                    </button>
                </div>
            </div>
        </div>
    );
};

interface InvoicesProps {
    activeBandId: string;
    invoices: Invoice[];
    bandSettings: BandSettings;
}

export const Invoices: React.FC<InvoicesProps> = ({ activeBandId, invoices: allInvoices, bandSettings }) => {
    const invoices = useMemo(() => allInvoices.filter(i => i.bandId === activeBandId), [allInvoices, activeBandId]);
    const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);

    const showNotification = (message: string) => {
        // This is a placeholder for a real toast notification system
        alert(message);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-4xl font-bold">Invoices</h1>
            </div>
            <div className="bg-gray-800 rounded-xl shadow-lg">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-700/50">
                            <tr>
                                <th className="p-3 text-sm font-semibold text-gray-300">Invoice #</th>
                                <th className="p-3 text-sm font-semibold text-gray-300">Recipient</th>
                                <th className="p-3 text-sm font-semibold text-gray-300">Date</th>
                                <th className="p-3 text-sm font-semibold text-gray-300">Due Date</th>
                                <th className="p-3 text-sm font-semibold text-gray-300">Status</th>
                                <th className="p-3 text-sm font-semibold text-gray-300 text-right">Amount</th>
                                <th className="p-3 text-right"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoices.sort((a,b) => new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime()).map(invoice => (
                                <tr key={invoice.id} className="border-b border-gray-700 last:border-b-0 hover:bg-gray-700/50">
                                    <td className="p-3 font-semibold">{invoice.invoiceNumber}</td>
                                    <td className="p-3 text-gray-300">{invoice.recipient.name}</td>
                                    <td className="p-3 text-gray-400">{new Date(invoice.invoiceDate).toLocaleDateString()}</td>
                                    <td className="p-3 text-gray-400">{new Date(invoice.dueDate).toLocaleDateString()}</td>
                                    <td className="p-3">
                                        <span className="text-xs font-bold px-2 py-1 rounded-full bg-green-500/20 text-green-300">{invoice.status}</span>
                                    </td>
                                    <td className="p-3 font-bold text-right">${invoice.total.toFixed(2)}</td>
                                    <td className="p-3 text-right flex gap-2 justify-end">
                                        <button onClick={() => setViewingInvoice(invoice)} className="p-1 rounded-full hover:bg-gray-600" title="View Details"><EyeIcon className="w-5 h-5 text-gray-400"/></button>
                                        <button onClick={() => showNotification('In a real app, this would download a PDF.')} className="p-1 rounded-full hover:bg-gray-600" title="Download PDF"><DownloadIcon className="w-5 h-5 text-blue-400"/></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {invoices.length === 0 && <p className="text-center text-gray-500 py-16">No invoices created yet. Add an "Income" transaction in the Financials section to generate one.</p>}
            </div>
            {viewingInvoice && <InvoiceDetailModal invoice={viewingInvoice} onClose={() => setViewingInvoice(null)} bandSettings={bandSettings} />}
        </div>
    );
};