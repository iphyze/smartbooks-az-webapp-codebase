import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../../services/api';
import useAuthStore from '../../../stores/useAuthStore';
import useThemeStore from '../../../stores/useThemeStore';
import Icon from "../../../assets/images/ico.png";

const ExpensePaymentScheduleReport = () => {
  const [reportType, setReportType] = useState('daily');
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { token } = useAuthStore();
  const { theme } = useThemeStore();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const res = await api.get(`/gaps/expense/report?type=${reportType}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setData(res.data);
      } catch (err) {
        console.error('Failed to fetch report:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (token) fetchData();
  }, [reportType, token]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{`${label}`}</p>
          <p className="tooltip-value">
            Total: NGN {payload[0].value.toLocaleString()}
          </p>
        </div>
      );
    }
    return null;
  };

  // if (isLoading) {
  //   return (
  //     <div className={`inner-loader-container theme-${theme}`}>
  //       <div className="loader-content">
  //         <img src={Icon} alt="Loading" className="loader-icon" />
  //         <p className="loader-text">Loading...</p>
  //       </div>
  //     </div>
  //   );
  // }

  // Custom axis styling
  const axisStyle = {
    fontSize: '12px',
    fontFamily: 'Outfit-Regular',
    fill: 'var(--main-text-color)'
  };

  // Empty state component
  const EmptyState = () => (
    <div className="empty-state">
      <div className="empty-state-content">
        <svg className="empty-state-icon" viewBox="0 0 24 24" width="48" height="48">
          <path fill="currentColor" d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z"/>
          <path fill="currentColor" d="M7 12h2v5H7zm4-3h2v8h-2zm4-3h2v11h-2z"/>
        </svg>
        <p className="empty-state-text">No data available for {reportType} report</p>
        <p className="empty-state-subtext">Try selecting a different time period</p>
      </div>
    </div>
  );

  return (
    <div className="payment-report-container prc-full-width">
      <div className="report-header">
        <h2 className="report-title">Expense Payment Schedule Report</h2>
        <div className='report-total-sum'>NGN {data.totalSum || "0.00"}</div>
      </div>

      <div className='report-controls-box'>
        <div className="report-controls">
          {['daily', 'weekly', 'monthly', 'yearly'].map((type) => (
            <button
              key={type}
              onClick={() => setReportType(type)}
              className={`report-button ${reportType === type ? 'active' : ''}`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="chart-container">
        {!data?.data?.length ? (
          <EmptyState />
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart 
              data={data?.data} 
              margin={{ top: 10, right: 10, left: 5, bottom: 5 }}
            >
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop 
                    offset="5%" 
                    stopColor="var(--active-link-color)" 
                    stopOpacity={0.8}
                  />
                  <stop 
                    offset="95%" 
                    stopColor="var(--active-link-color)" 
                    stopOpacity={0.1}
                  />
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
                dataKey="label" 
                stroke="var(--main-text-color)"
                tick={{ 
                  ...axisStyle,
                  dy: 10
                }}
                axisLine={{ stroke: 'var(--header-border-color)' }}
                tickLine={{ stroke: 'transparent' }}
              />
              <YAxis
                width={100} 
                stroke="var(--main-text-color)"
                tick={{
                  ...axisStyle,
                  dx: -5
                }}
                axisLine={{ stroke: 'transparent' }}
                tickLine={{ stroke: 'transparent' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="value"
                stroke="var(--active-link-color)"
                fill="url(#colorValue)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default ExpensePaymentScheduleReport;