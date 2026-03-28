import React from 'react';
import useThemeStore from '../../../../stores/useThemeStore';

const ViewModal = ({ onCancel, viewData }) => {
  const { theme } = useThemeStore();

  const handleModalClick = (e) => {
    e.stopPropagation();
  };

  const formatAmount = (amount) => {
    return Number(amount).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };


  return (
    <div className="view-modal-overlay" onClick={onCancel}>
      <div className="view-modal" onClick={handleModalClick}>

        <div className="view-modal-header">
            <div className='view-modal-heading-textbox'>
                <div className='view-modal-ht'>Payment Details</div>
                <div className='view-modal-subtext'>The below shows you the full info for this payment</div>
            </div>
        </div>

        <button className="view-modal-close fas fa-times" onClick={onCancel} />

        <div className='view-modal-content'>
            
            <div className='view-modal-details'>
                <div className='vmc-ht'>Supplier's Info</div>

                <div className='view-info-flexbox'>
                    <div className='view-info-col'>
                        <div className='view-info-ht'>Supplier's Name</div>
                        <div className='view-info-text'>{viewData?.suppliers_name}</div>
                    </div>
                    <div className='view-info-col'>
                        <div className='view-info-ht'>Po. Number</div>
                        <div className='view-info-text'>{viewData?.po_number}</div>
                    </div>
                </div>


                <div className='view-info-flexbox'>
                    <div className='view-info-col'>
                        <div className='view-info-ht'>Date Received</div>
                        <div className='view-info-text'>{viewData?.date_received}</div>
                    </div>
                    <div className='view-info-col'>
                        <div className='view-info-ht'>Site</div>
                        <div className='view-info-text'>{viewData?.site}</div>
                    </div>
                </div>
            </div>

            <div className='view-modal-details'>
                <div className='vmc-ht'>Payment Info</div>

                <div className='view-info-flexbox'>
                    <div className='view-info-col'>
                        <div className='view-info-ht'>Percentage</div>
                        <div className='view-info-text view-info-digit'>{viewData?.percentage}%</div>
                    </div>
                    <div className='view-info-col'>
                        <div className='view-info-ht'>Amount</div>
                        <div className='view-info-text view-info-digit'>₦ {formatAmount(viewData?.amount)}</div>
                    </div>
                </div>


                <div className='view-info-flexbox'>
                    <div className='view-info-col'>
                        <div className='view-info-ht'>Discount</div>
                        <div className='view-info-text view-info-digit'>₦ {formatAmount(viewData?.discount)}</div>
                    </div>
                    <div className='view-info-col'>
                        <div className='view-info-ht'>Net Amount</div>
                        <div className='view-info-text view-info-digit'>₦ {formatAmount(viewData?.net_amount)}</div>
                    </div>
                </div>


                <div className='view-info-flexbox'>
                    <div className='view-info-col'>
                        <div className='view-info-ht'>Vat</div>
                        <div className='view-info-text view-info-digit'>₦ {formatAmount(viewData?.vat)}</div>
                    </div>
                    <div className='view-info-col'>
                        <div className='view-info-ht'>Amount</div>
                        <div className='view-info-text view-info-digit'>₦ {formatAmount(viewData?.amount_payable)}</div>
                    </div>
                </div>


                <div className='view-info-flexbox'>
                    <div className='view-info-col'>
                        <div className='view-info-ht'>Other Charges</div>
                        <div className='view-info-text view-info-digit'>₦ {formatAmount(viewData?.other_charges)}</div>
                    </div>
                    <div className='view-info-col'>
                        <div className='view-info-ht'>Amount Paid</div>
                        <div className='view-info-text view-info-digit'>₦ {formatAmount(viewData?.advance_payment)}</div>
                    </div>
                </div>
            </div>


            <div className='view-modal-details'>
                <div className='vmc-ht'>Payment Status</div>

                <div className='view-info-flexbox'>
                    <div className='view-info-col'>
                        <div className='view-info-ht'>Payment Status</div>
                        <div className='view-info-text view-info-digit'>{viewData?.payment_status}</div>
                    </div>
                    <div className='view-info-col'>
                        <div className='view-info-ht'>Note</div>
                        <div className='view-info-text'>{viewData?.note ? viewData.note : 'N/A'}</div>
                    </div>
                </div>

            </div>


        </div>
        
      </div>
    </div>
  );
};


export default ViewModal;