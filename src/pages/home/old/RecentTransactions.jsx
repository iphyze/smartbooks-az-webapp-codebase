import React from "react";
import { Link } from "react-router-dom";
import useThemeStore from "../../stores/useThemeStore";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/autoplay";


const dummyTx = [
  { id: 1, name: "Lollyd Ltd", amount: 3200000, date: "20th April 2025", status: "Paid" },
  { id: 2, name: "Green Tech Nig", amount: 2780000, date: "14th May 2025", status: "Pending" },
  { id: 3, name: "Jumia Logistics", amount: 1200000, date: "5th Oct 2025", status: "Pending" },
];

const RecentTransactions = () => {
  const { theme } = useThemeStore();
  const transactions = dummyTx;

  const formatCurrency = (val) => `₦${val.toLocaleString()}`;

  return (
    <div className={`recent-transactions-box theme-${theme}`}>
      <p className="recent-transactions-header">Clients</p>

      {!transactions?.length ? (
        <div className="empty-recent-transaction-box">
          <span className="fas fa-folder-open empty-tx-icon" />
          <p className="empty-tx-text">
            You have no clients created yet, click the button below to create one immediately
          </p>
          <Link to="/create-client" className="create-invoice-btn">
            <span className="fas fa-circle-plus" /> Create Client
          </Link>
        </div>
      ) : (
        <Swiper modules={[Autoplay, Pagination]} spaceBetween={0} slidesPerView={1}
          autoplay={{delay: 5000, disableOnInteraction: false}}
          loop={true}
          pagination={{
            el: ".recent-tx-pagination",
            clickable: true,
            renderBullet: (index, className) =>
              `<span class="${className} recent-tx-bullet"><i class='fas fa-circle'></i></span>`,
          }}
        >
          {transactions.map((tx) => (
            <SwiperSlide key={tx.id}>
              <div className="recent-tx-card">
                <div className="recent-tx-card-overlay"/>
                <div className="recent-tx-icon-box">
                    <span className="fas fa-user"/>
                </div>
                <span className="recent-tx-name">{tx.name}</span>
                <span className="recent-tx-amount">{formatCurrency(tx.amount)}</span>
                <span className="recent-tx-date">{tx.date}</span>
                <span className="recent-tx-status">{tx.status}</span>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      )}

      {/* Pagination container */}
      {transactions?.length > 0 && (
        <>
        <div className="recent-tx-pagination"></div>
        
        <div className="recent-tx-btnbox">
          <Link to="/clients" className="recent-tx-btn">
            View All
          </Link>

          <Link to="/create-client" className="recent-tx-btn recent-tx-create-btn">
            Create New
          </Link>
        </div>
        </>
      )}

    </div>
  );
};

export default RecentTransactions;
