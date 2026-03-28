
import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import api from '../../../services/api';
import useAuthStore from '../../../stores/useAuthStore';
import Icon from "../../../assets/images/ico.png";
import useThemeStore from '../../../stores/useThemeStore';


const PaymentReportChart = () => {
  const [reportType, setReportType] = useState('daily');
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { token } = useAuthStore();
  const { theme } = useThemeStore();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const res = await api.get(`/gaps/advance/report?type=${reportType}`, {
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

//   if (isLoading) {
//     return (
//       <div className={`inner-loader-container theme-${theme}`}>
//         <div className="loader-content">
//           <img src={Icon} alt="Loading" className="loader-icon" />
//           <p className="loader-text">Loading...</p>
//         </div>
//       </div>
//     );
//   }

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


  // Custom axis styling
  const axisStyle = {
    fontSize: '12px',
    fontFamily: 'Outfit-Regular',
    fill: 'var(--main-text-color)'
  };

  return (
    <div className="payment-report-container">
      <div className="report-header">
        <h2 className="report-title">Advance Payment Analytics</h2>
        <div className='report-total-sum'>NGN {data.totalSum}</div>
      </div>

        <div className='report-controls-box'>
        <div className="report-controls">
            {['daily', 'weekly', 'monthly', 'yearly'].map((type) => (
            <button key={type} onClick={() => setReportType(type)}
                className={`report-button ${reportType === type ? 'active' : ''}`}
            >
                {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
            ))}
        </div>
      </div>

      <div className="chart-container">

        {!data?.data?.length ? <EmptyState /> :

        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={data?.data} margin={{ top: 10, right: 10, left: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="0" stroke="var(--header-border-color)" 
            opacity={0.5} horizontal={true} vertical={false}/>
            <XAxis dataKey="label" stroke="var(--main-text-color)"
              tick={{ 
                ...axisStyle,
                dy: 10
              }} axisLine={{ stroke: 'var(--header-border-color)' }} tickLine={{ stroke: 'transparent' }}
            />
            <YAxis 
            width={80}
            stroke="var(--main-text-color)" tick={{...axisStyle, dx: -10}} 
              axisLine={{ stroke: 'transparent' }} tickLine={{ stroke: 'transparent' }}
            />
            <Tooltip content={<CustomTooltip />} 
            cursor={{
                fill: theme === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
            }} />
            <Bar dataKey="total" 
                fill="var(--active-link-color)" 
                radius={[10, 10, 0, 0]} 
                maxBarSize={20}
                activeBar={{ fill: 'var(--active-submenu-link-color)' }}
                background={{ fill: 'transparent' }}
                stroke="none"
            />
          </BarChart>
        </ResponsiveContainer>
        }
        
      </div>
    </div>
  );
};

export default PaymentReportChart;