"use client";

import { useEffect, useState } from "react";
import { orgRoleApi } from "@/lib/orgRoleApi";
import { CircleDollarSign, TrendingUp, TrendingDown, Receipt } from "lucide-react";
import type { FinanceSummary } from "@/types";

export default function FinancePage() {
  const [data, setData] = useState<FinanceSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    orgRoleApi
      .getFinance()
      .then((res) => setData(res.data.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Loading financial records...</div>;
  }

  return (
    <div className="space-y-8 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Finance & Ticket Revenue</h1>
        <p className="text-sm text-slate-400 mt-1">
          Monitor your organization's event cash flows, ticket proceeds, and venue booking expenditures.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#111726] border border-white/10 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase">
            <span>Total Ticket Sales</span>
            <TrendingUp className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-extrabold text-white">₹{data?.totalRevenue?.toLocaleString() ?? 0}</p>
        </div>

        <div className="bg-[#111726] border border-white/10 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase">
            <span>Venue Booking Costs</span>
            <TrendingDown className="h-4 w-4 text-red-400" />
          </div>
          <p className="text-2xl font-extrabold text-white">₹{data?.totalVenueExpense?.toLocaleString() ?? 0}</p>
        </div>

        <div className="bg-[#111726] border border-white/10 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase">
            <span>Net Organization Balance</span>
            <CircleDollarSign className="h-4 w-4 text-amber-400" />
          </div>
          <p
            className={`text-2xl font-extrabold ${
              (data?.netProfit ?? 0) >= 0 ? "text-emerald-400" : "text-red-400"
            }`}
          >
            ₹{data?.netProfit?.toLocaleString() ?? 0}
          </p>
        </div>
      </div>

      {/* Event Breakdown */}
      <div className="bg-[#111726] border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10">
          <h3 className="font-semibold text-white">Ticket Sales Breakdown by Event</h3>
        </div>

        <div className="divide-y divide-white/5">
          {data?.eventRevenueBreakdown?.map((ev) => (
            <div key={ev.eventId} className="p-4 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-white text-sm">{ev.eventName}</h4>
                <p className="text-xs text-slate-400">
                  {ev.soldTickets} tickets sold @ ₹{ev.ticketPrice} each
                </p>
              </div>
              <span className="font-bold text-emerald-400 text-sm">
                +₹{ev.revenue.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Venue Expenses */}
      <div className="bg-[#111726] border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10">
          <h3 className="font-semibold text-white">Venue Booking Invoices</h3>
        </div>

        <div className="divide-y divide-white/5">
          {data?.venueBookings?.map((b) => (
            <div key={b._id} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Receipt className="h-5 w-5 text-slate-400" />
                <div>
                  <h4 className="font-bold text-white text-sm">{b.venueId?.venueName}</h4>
                  <p className="text-xs text-slate-400 capitalize">Status: {b.status}</p>
                </div>
              </div>
              <span className="font-bold text-red-400 text-sm">
                -₹{b.bookingAmount?.toLocaleString() ?? 0}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}