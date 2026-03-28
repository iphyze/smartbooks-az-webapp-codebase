import React, { useEffect, useState } from "react";
import {PieChart, Pie, Cell, Tooltip, ResponsiveContainer} from "recharts";
import api from "../../../services/api";
import useAuthStore from "../../../stores/useAuthStore";
import useThemeStore from "../../../stores/useThemeStore";
import Select from "react-select";
import { formatWithDecimals } from "../../../utils/helper";

const PaymentStatusReport = () => {
    const { token } = useAuthStore();
    const { theme } = useThemeStore();
    const [table, setTable] = useState("supplier_fund_request_table");
    const [year, setYear] = useState(new Date().getFullYear());
    const [data, setData] = useState([]);

    // Table options
    const tableOptions = [
        { value: "supplier_fund_request_table", label: "Supplier Fund Requests" },
        { value: "advance_payment_request", label: "Advance Payments" },
        { value: "expense_fund_request_table", label: "Expense Fund Requests" },
        { value: "compass_fund_request_table", label: "Compass Fund Requests" },
    ];

    // Year options (last 5 years + current)
    const currentYear = new Date().getFullYear();
    const yearOptions = Array.from({ length: 6 }, (_, i) => {
        const y = currentYear - i;
        return { value: y, label: y.toString() };
    });

    useEffect(() => {
        const fetchReport = async () => {
            try {
                const res = await api.get(
                    `/reports/paymentStatus?table=${table}&year=${year}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                const responseData = res.data.data || {};
                const formatted = Object.entries(responseData).map(([key, value]) => ({
                    name: key,
                    value: value || 0,
                }));
                setData(formatted);
            } catch (err) {
                console.error("Error fetching report:", err);
            }
        };

        if (token) fetchReport();
    }, [table, year, token]);

    const EmptyState = () => (
        <div className="empty-state">
            <div className="empty-state-content">
                <p className="empty-state-text">No data available</p>
                <p className="empty-state-subtext">
                    Try selecting a different table or year
                </p>
            </div>
        </div>
    );

    const COLORS = ["rgb(224, 160, 87)", "rgb(181, 224, 87)", "rgb(77, 199, 201)"]; // Pending, Paid, Unconfirmed
    const totalAmount = data.reduce((sum, item) => sum + item.value, 0);

    return (
        <div className="">
            <div className="report-header">
                <h2 className="report-title">Payment Status Analytics</h2>
            </div>

            {/* Controls */}
            <div className="report-controls-flexbox">
                <div className="report-controls-two">
                    <div className="main-form-group" style={{width: '200px'}}>
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

                <div className="main-form-group" style={{width: '100px'}}>
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
                <div className="summary-total">
                    <div className="donut-total-text">Total {year}</div>
                    <div className="donut-total">₦ {formatWithDecimals(totalAmount)}</div>
                </div>
                {!data.length || totalAmount === 0 ? (
                    <EmptyState />
                ) : (
                    <div className="donut-chart-wrapper">
                        <div className="donut-chart">
                        <ResponsiveContainer width="100%" height={330}>
                            <PieChart>
                                <Pie data={data} cx="50%" cy="50%"
                                    innerRadius={70}
                                    outerRadius={110}
                                    paddingAngle={4}
                                    dataKey="value"
                                >
                                    {data.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={COLORS[index % COLORS.length]}
                                            stroke="none"
                                        />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value, name) => [
                                        `${Number(value).toLocaleString()}`,
                                        name,
                                    ]}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        </div>

                        {/* Legend + Totals (styled like screenshot) */}
                        <div className="donut-summary">
                                {data.map((item, idx) => (
                                    <div key={idx} className="summary-item">
                                        <span className="dots" style={{ backgroundColor: COLORS[idx] }}/>
                                        <span className="donut-label">{item.name}</span>
                                        <span className="donut-value">₦ {formatWithDecimals(item.value)}</span>
                                    </div>
                                ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PaymentStatusReport;
