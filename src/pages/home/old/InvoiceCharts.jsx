import { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, } from "recharts";
import { invoiceData } from "./data/invoiceData";
import useThemeStore from "../../stores/useThemeStore";
import InnerLoaderComponent from "../../components/InnerLoaderComponent";
import EmptyState from "../../components/EmptyState";
import ChartSearchableSelect from "../../components/ChartSearchableSelect";


const InvoiceCharts = () => {
    const [range, setRange] = useState("yearly");
    const [chartData, setChartData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const { theme } = useThemeStore();

    useEffect(() => {
        setIsLoading(true);

        // simulate small data load delay for UI polish
        const timer = setTimeout(() => {
            setChartData(invoiceData[range]);
            setIsLoading(false);
        }, 500);

        return () => clearTimeout(timer);
    }, [range]);

    // Tooltip
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="custom-tooltip">
                    <p className="tooltip-label">{label}</p>
                    <p className="tooltip-value">
                        ₦{payload[0].value.toLocaleString()}
                    </p>
                </div>
            );
        }
        return null;
    };


    // Axis font style
    const axisStyle = {
        fontSize: "12px",
        fontFamily: "Montserrat-Light",
        fill: theme === 'dark' ? '#cbd6e2' : '#2e3642',
    };

    return (
        <div className={`chartBox theme-${theme}`}>

            <div className="chartBox-flexbox">
                <div className={`chart-title`}>Invoice Trend</div>

                {/* <select value={range} onChange={(e) => setRange(e.target.value)} className="chart-select">
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                </select> */}

                <ChartSearchableSelect
                    options={[
                        { id: "daily", label: "Daily" },
                        { id: "weekly", label: "Weekly" },
                        { id: "monthly", label: "Monthly" },
                        { id: "yearly", label: "Yearly" },
                    ]}
                    value={range}
                    onChange={(val) => setRange(val)}
                    // className="chart-select"
                    />

            </div>

            {/* Loading */}
            {isLoading && <InnerLoaderComponent />}

            {/* Empty */}
            {!isLoading && (!chartData || chartData.length === 0) && <EmptyState />}

            {/* Chart */}
            {!isLoading && chartData.length > 0 && (
                <div className={`chartInnerBox`}>
                    <div className={`mainChartBox`}>

                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="invoiceColor" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#4cd964" stopOpacity={0.7} />
                                        <stop offset="95%" stopColor="#4cd964" stopOpacity={0.1} />
                                    </linearGradient>
                                </defs>

                                <CartesianGrid 
                                strokeDasharray="0" 
                                stroke={theme === 'dark' ? '#cbd6e2' : '#717c87'} 
                                opacity={theme === 'dark' ? 0.05 : 0.03} 
                                horizontal={true} 
                                vertical={false} />

                                <XAxis dataKey="name" stroke="transparent" tick={{ ...axisStyle, dy: 10 }}
                                    // axisLine={{ stroke: theme === 'dark' ? '#425166' : '#E9EEF7', strokeWidth: 1 }}
                                    axisLine={{ stroke: "transparent" }} 
                                    tickLine={{ stroke: "transparent" }}
                                    // padding={{ left: 20, right: 20 }}
                                />

                                <YAxis stroke="transparent" tick={{ ...axisStyle, dx: -5 }} axisLine={{ stroke: "transparent" }} tickLine={{ stroke: "transparent" }} />


                                <Tooltip content={<CustomTooltip />} />

                                <Area type="monotone" dataKey="value" stroke="#2ECC71" strokeWidth={1} fill="url(#invoiceColor)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InvoiceCharts;
