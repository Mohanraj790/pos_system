import React from 'react';
import { Invoice, Store } from '../types';

export const InvoicePrint: React.FC<{ invoice: Invoice, store: Store }> = ({ invoice, store }) => {
  return (
    <div className="font-mono text-xs w-full max-w-[300px] mx-auto bg-white p-2">
      <div className="text-center mb-4">
        <h1 className="text-lg font-bold uppercase">{store.name}</h1>
        <p>{store.address}</p>
        <p>GSTIN: {store.gstNumber}</p>
        <p className="border-b border-black pb-2 mt-2">Tax Invoice</p>
      </div>
      
      <div className="mb-2">
        <p>Inv No: {invoice.invoiceNumber}</p>
        <p>Date: {new Date(invoice.date).toLocaleString()}</p>
      </div>

      <table className="w-full text-left mb-2 border-collapse">
        <thead>
          <tr className="border-b border-black border-dashed">
            <th className="py-1 w-[40%]">Item</th>
            <th className="py-1 text-center w-[15%]">Qty</th>
            <th className="py-1 text-right w-[20%]">Disc</th>
            <th className="py-1 text-right w-[25%]">Amt</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((item, idx) => (
            <tr key={idx}>
              <td className="py-1 align-top pr-1">
                <div className="break-words line-clamp-2">{item.name}</div>
              </td>
              <td className="py-1 text-center align-top">{item.quantity}</td>
              <td className="py-1 text-right align-top">
                {item.appliedDiscountPercent > 0 ? `${item.appliedDiscountPercent}%` : '-'}
              </td>
              <td className="py-1 text-right align-top">{item.lineTotal.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="border-t border-black border-dashed pt-2 space-y-1">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>{store.currency} {invoice.subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Tax Total:</span>
          <span>{store.currency} {invoice.taxTotal.toFixed(2)}</span>
        </div>
        {invoice.discountTotal > 0 && (
          <div className="flex justify-between">
            <span>Discount:</span>
            <span>-{store.currency} {invoice.discountTotal.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-sm border-t border-black pt-1 mt-1">
          <span>Grand Total:</span>
          <span>{store.currency} {invoice.grandTotal.toFixed(2)}</span>
        </div>
      </div>

      <div className="text-center mt-4 border-t border-black pt-2">
        <p>Payment: {invoice.paymentMethod}</p>
        <p className="mt-2">Thank you for visiting!</p>
        <p className="text-[10px] text-slate-500 mt-1">Powered by UniBill</p>
      </div>
    </div>
  );
};