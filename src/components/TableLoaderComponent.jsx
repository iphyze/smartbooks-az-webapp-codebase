import React, { useState, useEffect } from "react";
import Icon from "../assets/images/digitInvoice/icon.png";
import useThemeStore from "../stores/useThemeStore";


const TableLoaderComponent = () => {
    const { theme } = useThemeStore();

    return (
        <div className={`table-loader-container theme-${theme}`}>
            <div className="loader-content">
            <img src={Icon} alt="Loading" className="loader-icon" />
            <p className="loader-text">Loading...</p>
            </div>
        </div>
    );
};

export default TableLoaderComponent;