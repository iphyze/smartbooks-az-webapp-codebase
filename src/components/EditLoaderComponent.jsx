import React, { useState, useEffect } from "react";
import Icon from "../assets/images/digitInvoice/icon.png";
import useThemeStore from "../stores/useThemeStore";


const EditLoaderComponent = ({text}) => {
    const { theme } = useThemeStore();

    return (
        <div className={`table-edit-loader-container theme-${theme}`}>
            <div className="loader-content">
            <img src={Icon} alt="Loading" className="loader-icon" />
            <p className="loader-text">{text || 'Loading Page...'}</p>
            </div>
        </div>
    );
};

export default EditLoaderComponent;