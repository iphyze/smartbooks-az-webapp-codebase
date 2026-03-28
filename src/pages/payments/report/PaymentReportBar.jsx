import React, { useEffect, useState } from "react";
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import api from "../../../services/api";
import useAuthStore from "../../../stores/useAuthStore";
import useThemeStore from "../../../stores/useThemeStore";
import Select from "react-select";
import { formatWithDecimals } from "../../../utils/helper";

const PaymentReportBar = () => {
  const { token } = useAuthStore();
  const { theme } = useThemeStore();
  const [table, setTable] = useState("supplier_fund_request_table");
  const [year, setYear] = useState(new Date().getFullYear());
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const tableOptions = [
    { value: "supplier_fund_request_table", label: "Supplier Fund Requests" },
    { value: "advance_payment_request", label: "Advance Payments" },
    { value: "expense_fund_request_table", label: "Expense Fund Requests" },
    { value: "compass_fund_request_table", label: "Compass Fund Requests" },
  ];

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 6 }, (_, i) => {
    const y = currentYear - i;
    return { value: y, label: y.toString() };
  });

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setIsLoading(true);
        const res = await api.get(
          `/reports/paymentStatusBar?table=${table}&year=${year}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setData(res.data.data || []);
      } catch (err) {
        console.error("Error fetching monthly report:", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (token) fetchReport();
  }, [table, year, token]);

  const COLORS = {
    pending: "rgb(224, 160, 87)",
    paid: "rgb(181, 224, 87)",
    unconfirmed: "rgb(77, 199, 201)",
  };

  const EmptyState = () => (
    <div className="empty-state">
      <div className="empty-state-content">
        <svg
          className="empty-state-icon"
          viewBox="0 0 24 24"
          width="48"
          height="48"
        >
          <path
            fill="currentColor"
            d="M19 3H5c-1.1 0-2 .9-2 2v14c0 
               1.1.9 2 2 2h14c1.1 0 2-.9 
               2-2V5c0-1.1-.9-2-2-2zm0 
               16H5V5h14v14z"
          />
          <path
            fill="currentColor"
            d="M7 12h2v5H7zm4-3h2v8h-2zm4-3h2v11h-2z"
          />
        </svg>
        <p className="empty-state-text">
          No data available for {year}
        </p>
        <p className="empty-state-subtext">
          Try selecting a different table or year
        </p>
      </div>
    </div>
  );

  const axisStyle = {
    fontSize: "12px",
    fontFamily: "Outfit-Regular",
    fill: "var(--main-text-color)",
  };

  const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    // Filter to only show Line components or unique dataKeys to avoid duplicates
    const uniquePayload = payload.filter((entry, index, array) => {
      // Prefer Line components over Area components
      const lineEntry = array.find(item => item.dataKey === entry.dataKey && item.type === 'line');
      if (lineEntry) {
        return entry.type === 'line';
      }
      // If no line entry exists, show the first occurrence
      return array.findIndex(item => item.dataKey === entry.dataKey) === index;
    });

    return (
      <div className="custom-tooltip">
        <p className="tooltip-label">{`${label}`}</p>
        {uniquePayload.map((entry, index) => (
          <p key={index} className="tooltip-value">
            {entry.name || entry.dataKey}: NGN {formatWithDecimals(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

  return (
    <div className="payment-report-container prc-full-width">
      <div className="report-header">
        <h2 className="report-title align-left">
          Monthly Payment Status - {year}
        </h2>
      </div>

      {/* Controls */}
      <div className="report-controls-flexbox">
        <div className="report-controls-two">
          <div className="main-form-group" style={{ width: "240px" }}>
            <Select
              options={tableOptions}
              value={tableOptions.find((option) => option.value === table)}
              onChange={(option) =>
                setTable(option?.value || "supplier_fund_request_table")
              }
              className="react-select"
              classNamePrefix="select"
              placeholder="Select Table"
              isClearable={false}
            />
          </div>
        </div>

        <div className="report-controls-two">
          <div className="main-form-group" style={{ width: "120px" }}>
            <Select
              options={yearOptions}
              value={yearOptions.find((option) => option.value === year)}
              onChange={(option) => setYear(option?.value || currentYear)}
              className="react-select"
              classNamePrefix="select"
              placeholder="Select Year"
              isClearable={false}
            />
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="chart-container">
        {isLoading ? (
          <div className={`inner-loader-container theme-${theme}`}>
            <div className="loader-content">
              <p className="loader-text">Loading...</p>
            </div>
          </div>
        ) : !data.length ? (
          <EmptyState />
        ) : (
          <div className="responsive-container">
            <ResponsiveContainer width="100%" height={400}>
              <ComposedChart
                data={data}
                margin={{ top: 20, right: 20, bottom: 20, left: 0 }}
              >
                {/* Gradient Definitions */}
                <defs>
                  <linearGradient id="colorPending" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.pending} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={COLORS.pending} stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="colorPaid" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.paid} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={COLORS.paid} stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="colorUnconfirmed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.unconfirmed} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={COLORS.unconfirmed} stopOpacity={0.1} />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="0"
                  stroke="var(--header-border-color)"
                  opacity={0.5}
                  horizontal={true}
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  tick={{ ...axisStyle, dy: 10 }}
                  axisLine={{ stroke: "var(--header-border-color)" }}
                  tickLine={{ stroke: "transparent" }}
                />
                <YAxis
                  width={80}
                  tick={{ ...axisStyle, dx: -10 }}
                  axisLine={{ stroke: "transparent" }}
                  tickLine={{ stroke: "transparent" }}
                />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{
                    stroke:
                      theme === "dark"
                        ? "rgba(255, 255, 255, 0.2)"
                        : "rgba(0, 0, 0, 0.2)",
                    strokeWidth: 1,
                  }}
                />
                <Legend
                  verticalAlign="top"
                  align="right"
                  wrapperStyle={{
                    paddingBottom: "40px",
                    fontSize: "13px",
                    fontFamily: "Montserrat-Regular",
                  }}
                />

                {/* Background Areas with Gradients */}
                <Area
                  type="monotone"
                  dataKey="pending"
                  stroke="none"
                  fill="url(#colorPending)"
                  fillOpacity={1}
                  legendType="none"
                />
                <Area
                  type="monotone"
                  dataKey="paid"
                  stroke="none"
                  fill="url(#colorPaid)"
                  fillOpacity={1}
                  legendType="none"
                />
                <Area
                  type="monotone"
                  dataKey="unconfirmed"
                  stroke="none"
                  fill="url(#colorUnconfirmed)"
                  fillOpacity={1}
                  legendType="none"
                />

                {/* Lines on top */}
                <Line
                  type="monotone"
                  dataKey="pending"
                  stroke={COLORS.pending}
                  strokeWidth={1}
                //   dot={{ r: 4, fill: COLORS.pending }}
                //   activeDot={{ r: 6, fill: COLORS.pending }}
                  name="Pending"
                />
                <Line
                  type="monotone"
                  dataKey="paid"
                  stroke={COLORS.paid}
                  strokeWidth={1}
                //   dot={{ r: 4, fill: COLORS.paid }}
                //   activeDot={{ r: 6, fill: COLORS.paid }}
                  name="Paid"
                  />
                <Line
                  type="monotone"
                  dataKey="unconfirmed"
                  stroke={COLORS.unconfirmed}
                  strokeWidth={1}
                //   dot={{ r: 4, fill: COLORS.unconfirmed }}
                //   activeDot={{ r: 6, fill: COLORS.unconfirmed }}
                  name="Unconfirmed"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentReportBar;