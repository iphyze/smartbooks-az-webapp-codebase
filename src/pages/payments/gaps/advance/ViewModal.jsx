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
                <div className='vmc-ht'>Payment Info</div>

                <div className='view-info-flexbox'>
                    <div className='view-info-col'>
                        <div className='view-info-ht'>Date</div>
                        <div className='view-info-text'>{viewData?.payment_date}</div>
                    </div>
                    <div className='view-info-col'>
                        <div className='view-info-ht'>Description</div>
                        <div className='view-info-text'>{viewData?.remark}</div>
                    </div>
                </div>


                <div className='view-info-flexbox'>
                    <div className='view-info-col'>
                        <div className='view-info-ht'>Amount</div>
                        <div className='view-info-text'>₦ {formatAmount(viewData?.payment_amount)}</div>
                    </div>
                    <div className='view-info-col'>
                        <div className='view-info-ht'>PO Number(s)</div>
                        <div className='view-info-text'>{viewData?.po_numbers}</div>
                    </div>
                </div>
            </div>


            <div className='view-modal-details'>
                <div className='vmc-ht'>Supplier's Bank Details</div>

                <div className='view-info-flexbox'>
                    <div className='view-info-col'>
                        <div className='view-info-ht'>Account Number</div>
                        <div className='view-info-text'>{viewData?.account_number}</div>
                    </div>
                    <div className='view-info-col'>
                        <div className='view-info-ht'>Account Name</div>
                        <div className='view-info-text'>{viewData?.account_name}</div>
                    </div>
                </div>


                <div className='view-info-flexbox'>
                    <div className='view-info-col'>
                        <div className='view-info-ht'>Bank Name</div>
                        <div className='view-info-text'>{viewData?.bank_name}</div>
                    </div>
                    <div className='view-info-col'>
                        <div className='view-info-ht'>Sort Code</div>
                        <div className='view-info-text'>{viewData?.sort_code}</div>
                    </div>
                </div>
            </div>


        </div>
        
      </div>
    </div>
  );
};


export default ViewModal;