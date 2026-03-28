import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../../../../services/api';
import useAuthStore from '../../../../stores/useAuthStore';
import useThemeStore from '../../../../stores/useThemeStore';
import Icon from "../../../../assets/images/ico.png";

const COLORS = [
  'var(--active-link-color)',
  'var(--menu-link-hover)',
  'var(--active-submenu-link-color)',
  '#FF8042',
  '#A28CF0',
  '#FF6666',
  '#66CC66',
  '#FF99CC',
];

const SupplierPaymentScheduleReport = () => {
  const [reportType, setReportType] = useState('daily');
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { token } = useAuthStore();
  const { theme } = useThemeStore();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const res = await api.get(`/gaps/supplier/report?type=${reportType}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setData(res.data);
      } catch (err) {
        console.error('Failed to fetch pie chart data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (token) fetchData();
  }, [reportType, token]);

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

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{payload[0].name}</p>
          <p className="tooltip-value">
            NGN {payload[0].value.toLocaleString()}
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

  // if(data?.data?.length > 0){
  //   return <EmptyState />
  // }

  return (
    <div className="payment-report-container">
      <div className="report-header">
        <h2 className="report-title">Supplier's Payment Distribution</h2>
        <div className='report-total-sum'>NGN {data.totalSum}</div>
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
        {!data?.data?.length ?
          <EmptyState /> :
        <ResponsiveContainer width="100%" height={320}>
          <PieChart>
            <Pie
              data={data?.data} cx="50%" cy="50%" innerRadius={60} outerRadius={100}
              paddingAngle={5} dataKey="value" nameKey="label"
              label={({cx, cy, midAngle, innerRadius, outerRadius, value, index
              }) => {
                const RADIAN = Math.PI / 180;
                const radius = 25 + innerRadius + (outerRadius - innerRadius);
                const x = cx + radius * Math.cos(-midAngle * RADIAN);
                const y = cy + radius * Math.sin(-midAngle * RADIAN);

                return (
                  <text x={x} y={y} className="pie-chart-label" textAnchor={x > cx ? 'start' : 'end'}
                    dominantBaseline="central" fill="var(--main-text-color)" fontSize="12px" fontFamily="Outfit-Regular">
                    {`${data?.data[index]?.label}`}
                  </text>
                );
              }}
            >
              {data?.data?.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="var(--card-bg-color)" strokeWidth={2}/>
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              formatter={(value) => (
                <span style={{ 
                  color: 'var(--main-text-color)',
                  fontFamily: 'Outfit-Regular',
                  fontSize: '12px'
                }}>
                  {value}
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
        }
      </div>
    </div>
  );
};

export default SupplierPaymentScheduleReport;