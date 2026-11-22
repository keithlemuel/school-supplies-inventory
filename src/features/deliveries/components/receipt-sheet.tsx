import { Libre_Franklin } from "next/font/google";

import { date } from "@/lib/format";
import { SHOP_LETTERHEAD } from "@/lib/shop";
import type { Receipt } from "../queries";

/*
  The store's delivery receipt, laid out to match its Excel form: the blue
  letterhead, "Sold to" with Delivery No. and Date, the green-headed table with
  striped rows, then Released / Received / Total.

  The Excel form is set in Constantia (labels) and Franklin Gothic Book
  (everything else). Both are used when the computer has them; Libre Franklin
  and Georgia stand in when it does not.
*/
const franklin = Libre_Franklin({ subsets: ["latin"], variable: "--font-receipt" });

const BODY_FONT = '"Franklin Gothic Book", var(--font-receipt), Arial, sans-serif';
const LABEL_FONT = 'Constantia, "Palatino Linotype", Georgia, serif';

const NAVY = "#1F497D"; // the form's outer rules
const RULE = "#BAC1D2"; // the pale rules between cells
const STRIPE = "#F2F2F2";
const HEADER = "#92D050";
const LABEL_INK = "#333A56";
const TOTAL_BOX = "#7D4333";

/** The Excel form has 24 rows; longer receipts simply grow. */
const MIN_ROWS = 24;

const amount = new Intl.NumberFormat("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const quantity = new Intl.NumberFormat("en-PH", { maximumFractionDigits: 2 });
const peso = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" });

export function ReceiptSheet({ receipt }: { receipt: Receipt }) {
  const blanks = Math.max(0, MIN_ROWS - receipt.lines.length);
  const rows = [...receipt.lines, ...Array.from({ length: blanks }, () => null)];
  const cell = `border-l px-[5pt] first:border-l-0`;

  return (
    <div
      className={`${franklin.variable} receipt-sheet mx-auto w-[194mm] max-w-none bg-white text-[10pt] leading-tight text-black`}
      style={{ fontFamily: BODY_FONT }}
    >
      {/* Letterhead: the banner picture with the store's details set over it in white. */}
      <div className="relative text-white" style={{ fontFamily: LABEL_FONT }}>
        {/* A plain img: the banner has to print exactly as it is, at any paper size. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/delivery-receipt-banner.jpg" alt="" className="block h-[34mm] w-full object-cover" />
        <div className="absolute inset-0 flex items-start justify-between px-[5mm] pt-[3mm]">
          <div className="leading-[1.25]">
            <p className="text-[14pt]">{SHOP_LETTERHEAD.name}</p>
            {SHOP_LETTERHEAD.lines.map((line) => (
              <p key={line} className="text-[10pt]">
                {line}
              </p>
            ))}
          </div>
          <div className="pt-[5mm] text-right leading-[1.25]">
            <p className="text-[18pt]">Delivery Receipt</p>
            <p className="text-[11pt]">{SHOP_LETTERHEAD.taxNote}</p>
          </div>
        </div>
      </div>

      {/* Sold to, Delivery No., Date */}
      <div className="mt-[9mm] grid grid-cols-[18mm_minmax(0,1fr)_auto_30mm] items-center gap-x-[3mm] gap-y-[2.5mm] px-[1mm]">
        <p className="text-center text-[12pt]" style={{ fontFamily: LABEL_FONT, color: LABEL_INK }}>
          Sold to
        </p>
        <p className="font-bold">{receipt.customerName}</p>
        <p className="text-right text-[12pt]" style={{ fontFamily: LABEL_FONT, color: LABEL_INK }}>
          Delivery No.
        </p>
        <p>{receipt.number}</p>

        <span />
        <p>{receipt.customerAddress}</p>
        <p className="text-right text-[12pt]" style={{ fontFamily: LABEL_FONT, color: LABEL_INK }}>
          Date
        </p>
        <p>{date(receipt.deliveredOn)}</p>
      </div>

      {/* The table */}
      <table
        className="mt-[2.5mm] w-full table-fixed border-collapse"
        style={{ borderLeft: `1px solid ${NAVY}`, borderRight: `1px solid ${NAVY}`, borderTop: `2.5px solid ${NAVY}`, borderBottom: `2.5px solid ${NAVY}` }}
      >
        <colgroup>
          <col className="w-[10.2%]" />
          <col className="w-[10.2%]" />
          <col className="w-[48.8%]" />
          <col className="w-[15.4%]" />
          <col className="w-[15.4%]" />
        </colgroup>
        <thead>
          <tr className="h-[20pt] text-[11pt] font-bold text-white" style={{ background: HEADER }}>
            {["Quantity", "Unit", "Description", "Unit Price", "Total"].map((heading) => (
              <th key={heading} className="border-l text-center first:border-l-0" style={{ borderColor: NAVY }}>
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((line, index) => {
            const last = index === rows.length - 1;
            return (
              <tr
                key={line?.id ?? `blank-${index}`}
                className="h-[14.1pt]"
                style={{
                  background: index % 2 === 1 ? STRIPE : "#fff",
                  // The form closes with one heavier-ruled row.
                  borderTop: `${last ? 3 : 1}px solid ${RULE}`,
                }}
              >
                <td className={`${cell} text-center`} style={{ borderColor: RULE }}>
                  {line ? quantity.format(line.quantity) : null}
                </td>
                <td className={`${cell} text-center`} style={{ borderColor: RULE }}>
                  {line?.unit}
                </td>
                <td className={`${cell} text-left`} style={{ borderColor: RULE }}>
                  {line?.description}
                </td>
                <td className={`${cell} text-right tabular-nums`} style={{ borderColor: RULE }}>
                  {line ? amount.format(line.unitPrice) : null}
                </td>
                <td className={`${cell} text-right tabular-nums`} style={{ borderColor: RULE }}>
                  {line ? amount.format(line.quantity * line.unitPrice) : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Released / Received / Total */}
      <div className="mt-[5mm] grid grid-cols-[20.4%_minmax(0,1fr)_auto_15.4%] items-center gap-x-0 break-inside-avoid">
        <p className="px-[1mm]">Released:</p>
        <p className="px-[1mm]">Received the above items in good order and condition.</p>
        <p className="pr-[1.5mm] text-right text-[12pt]" style={{ fontFamily: LABEL_FONT, color: LABEL_INK }}>
          Total
        </p>
        <p
          className="flex h-[7.5mm] items-center justify-center border text-white tabular-nums"
          style={{ background: TOTAL_BOX, borderColor: NAVY }}
        >
          {peso.format(receipt.total)}
        </p>

        <span className="mt-[9mm] block border-b border-black" />
        <p className="self-start px-[1mm] pt-[1.5mm]">By: ___________________________________</p>
        <span />
        <span />
      </div>
    </div>
  );
}
