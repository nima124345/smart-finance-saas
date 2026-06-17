"use client";

import { useState } from "react";
import { Download, FileSpreadsheet, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ErrorState } from "@/components/common/error-state";
import { LoadingState } from "@/components/common/loading-state";
import { PageHeader } from "@/components/common/page-header";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/format";
import type { ReportKind, ReportPeriodKey } from "../types";
import { useExportReport, useReport } from "../hooks/use-business";
import { BusinessTrendChart } from "./business-trend-chart";
import { GrowthBadge, MetricCard } from "./metric";

const KINDS: { value: ReportKind; label: string }[] = [
  { value: "profit", label: "กำไร-ขาดทุน" },
  { value: "revenue", label: "รายได้" },
  { value: "expenses", label: "ค่าใช้จ่าย" },
];

const PERIODS: { value: ReportPeriodKey; label: string }[] = [
  { value: "this_month", label: "เดือนนี้" },
  { value: "last_month", label: "เดือนที่แล้ว" },
  { value: "custom_range", label: "กำหนดเอง" },
];

export function ReportsView() {
  const [kind, setKind] = useState<ReportKind>("profit");
  const [period, setPeriod] = useState<ReportPeriodKey>("this_month");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const params = {
    period,
    ...(period === "custom_range" ? { dateFrom, dateTo } : {}),
  };
  const report = useReport(kind, params);
  const exporter = useExportReport();

  const doExport = (format: "pdf" | "excel") =>
    exporter.mutate({ format, params: { report: kind, ...params } });

  const data = report.data;

  return (
    <>
      <PageHeader
        title="รายงานธุรกิจ"
        description="รายได้ · ค่าใช้จ่าย · กำไร-ขาดทุน"
        action={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={exporter.isPending || !data}
              onClick={() => doExport("pdf")}
            >
              <FileText className="h-4 w-4" /> PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={exporter.isPending || !data}
              onClick={() => doExport("excel")}
            >
              <FileSpreadsheet className="h-4 w-4" /> Excel
            </Button>
          </div>
        }
      />

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
          <div className="flex flex-wrap gap-1.5">
            {KINDS.map((k) => (
              <Button
                key={k.value}
                variant={kind === k.value ? "default" : "outline"}
                size="sm"
                onClick={() => setKind(k.value)}
              >
                {k.label}
              </Button>
            ))}
          </div>
          <div className="flex flex-1 flex-wrap items-end gap-2">
            <div className="w-40">
              <Select
                value={period}
                onChange={(e) => setPeriod(e.target.value as ReportPeriodKey)}
              >
                {PERIODS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </Select>
            </div>
            {period === "custom_range" && (
              <>
                <Input
                  type="date"
                  className="w-40"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
                <Input
                  type="date"
                  className="w-40"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {report.isLoading ? (
        <LoadingState rows={4} />
      ) : report.isError || !data ? (
        <ErrorState onRetry={() => report.refetch()} />
      ) : (
        <div className={cn("space-y-6", report.isFetching && "opacity-60")}>
          {/* Summary */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard label="รายได้" value={formatMoney(data.summary.revenue)} />
            <MetricCard label="ค่าใช้จ่าย" value={formatMoney(data.summary.expense)} />
            <MetricCard
              label="กำไรสุทธิ"
              value={formatMoney(data.summary.net)}
              accent={BigInt(data.summary.net) >= 0n ? "text-income" : "text-expense"}
              footer={
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  เทียบช่วงก่อน <GrowthBadge pct={data.summary.netGrowthPct} />
                </span>
              }
            />
            <MetricCard
              label="อัตรากำไร"
              value={data.summary.margin === null ? "—" : `${data.summary.margin}%`}
              footer={
                <span className="text-xs text-muted-foreground">
                  {data.summary.count} รายการ
                </span>
              }
            />
          </div>

          <BusinessTrendChart
            revenueTrend={data.trend.map((t) => ({
              label: t.label,
              amount: t.income,
            }))}
            expenseTrend={data.trend.map((t) => ({
              label: t.label,
              amount: t.expense,
            }))}
          />

          {/* Category breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {kind === "revenue" ? "รายได้ตามหมวดหมู่" : "ค่าใช้จ่ายตามหมวดหมู่"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.categories.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  ไม่มีข้อมูลในช่วงนี้
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>หมวดหมู่</TableHead>
                      <TableHead className="text-right">จำนวนเงิน</TableHead>
                      <TableHead className="text-right">สัดส่วน</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.categories.map((c) => (
                      <TableRow key={c.categoryId ?? c.name}>
                        <TableCell className="font-medium">{c.name}</TableCell>
                        <TableCell className="text-right font-mono tabular-nums">
                          {formatMoney(c.total)}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {c.pct}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {exporter.isError && (
            <p className="text-sm text-destructive">ส่งออกไฟล์ไม่สำเร็จ ลองใหม่อีกครั้ง</p>
          )}
        </div>
      )}
    </>
  );
}
