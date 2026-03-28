import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../../services/api';
import useAuthStore from '../../../stores/useAuthStore';
import useThemeStore from '../../../stores/useThemeStore';
import Icon from "../../../assets/images/ico.png";

const AdvanceRequestSummaryChart = () => {
  const [timeFrame, setTimeFrame] = useState('daily');
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { token } = useAuthStore();
  const { theme } = useThemeStore();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const res = await api.get(`/request/advance/getReports?type=summary&timeFrame=${timeFrame}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        // Transform the time_series data for the chart
        const timeSeriesData = Object.entries(res.data.data.time_series).map(([date, statuses]) => ({
          date,
          Pending: statuses.Pending?.amount || 0,
          Paid: statuses.Paid?.amount || 0,
          Unconfirmed: statuses.Unconfirmed?.amount || 0
        }));

        setData({
          timeSeriesData,
          statusSummary: res.data.data.status_summary,
          trends: res.data.data.trends
        });
      } catch (err) {
        console.error('Failed to fetch report:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (token) fetchData();
  }, [timeFrame, token]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{`Date: ${label}`}</p>
          {payload.map((entry, index) => {
            let color;
            switch(entry.name) {
              case 'Pending':
                color = 'var(--pending-bar)';
                break;
              case 'Paid':
                color = 'var(--paid-bar)';
                break;
              case 'Unconfirmed':
                color = 'var(--unconfirmed-bar)';
                break;
              default:
                color = entry.color;
            }
            return (
              <p key={index} className="tooltip-value" style={{ color }}>
                {entry.name}: NGN {entry.value.toLocaleString()}
              </p>
            );
          })}
        </div>
      );
    }
    return null;
  };

  const axisStyle = {
    fontSize: '12px',
    fontFamily: 'Outfit-Regular',
    fill: 'var(--main-text-color)'
  };

  const EmptyState = () => (
    <div className="empty-state">
      <div className="empty-state-content">
        <svg className="empty-state-icon" viewBox="0 0 24 24" width="48" height="48">
          <path fill="currentColor" d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z"/>
          <path fill="currentColor" d="M7 12h2v5H7zm4-3h2v8h-2zm4-3h2v11h-2z"/>
        </svg>
        <p className="empty-state-text">No data available for {timeFrame} report</p>
        <p className="empty-state-subtext">Try selecting a different time period</p>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className={`inner-loader-container theme-${theme}`}>
        <div className="loader-content">
          <img src={Icon} alt="Loading" className="loader-icon" />
          <p className="loader-text">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-report-container prc-full-width">
      <div className="report-header">
        <h2 className="report-title">Advance Request Payment Trends</h2>
        <div className='report-total-sum'>
          NGN {data?.trends?.total_amount?.toLocaleString() || "0.00"}
        </div>
      </div>

      <div className="summary-stats">
        <div className="stat-card">
          <span className="stat-label">Total Requests</span>
          <span className="stat-value">{data?.trends?.total_requests || 0}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Pending Rate</span>
          <span className="stat-value">{data?.trends?.pending_percentage?.toFixed(1) || 0}%</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Completion Rate</span>
          <span className="stat-value">{data?.trends?.paid_percentage?.toFixed(1) || 0}%</span>
        </div>
      </div>

      <div className='report-controls-box'>
        <div className="report-controls">
          {['daily', 'weekly', 'monthly', 'yearly'].map((type) => (
            <button
              key={type}
              onClick={() => setTimeFrame(type)}
              className={`report-button ${timeFrame === type ? 'active' : ''}`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="chart-container">
        {!data?.timeSeriesData?.length ? (
          <EmptyState />
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart 
              data={data.timeSeriesData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              stackOffset="none"
            >
              <defs>
                <linearGradient id="colorPending" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--pending-bar)" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="var(--pending-bar)" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorPaid" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--paid-bar)" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="var(--paid-bar)" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorUnconfirmed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--unconfirmed-bar)" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="var(--unconfirmed-bar)" stopOpacity={0.1}/>
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
                dataKey="date"
                stroke="var(--main-text-color)"
                tick={{ ...axisStyle, dy: 10 }}
                axisLine={{ stroke: 'var(--header-border-color)' }}
                tickLine={{ stroke: 'transparent' }}
              />
              
              <YAxis 
                stroke="var(--main-text-color)"
                tick={{ ...axisStyle, dx: -5 }}
                axisLine={{ stroke: 'transparent' }}
                tickLine={{ stroke: 'transparent' }}
              />
              
              <Tooltip content={<CustomTooltip />} />

              <Area
                type="monotone"
                dataKey="Pending"
                stackId="1"
                stroke="var(--pending-color)"
                fill="url(#colorPending)"
                strokeWidth={2}
              />
              
              <Area
                type="monotone"
                dataKey="Paid"
                stackId="1"
                stroke="var(--paid-color)"
                fill="url(#colorPaid)"
                strokeWidth={2}
              />
              
              <Area
                type="monotone"
                dataKey="Unconfirmed"
                stackId="1"
                stroke="var(--unconfirmed-color)"
                fill="url(#colorUnconfirmed)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default AdvanceRequestSummaryChart;