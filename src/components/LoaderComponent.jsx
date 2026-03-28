import React, { useState, useEffect } from "react";
import Icon from "../assets/images/digitInvoice/ico.png";
import useThemeStore from "../stores/useThemeStore";


const LoaderComponent = () => {
    const { theme } = useThemeStore();

    return (
        <div className={`loader-container theme-${theme}`}>
            <div className="loader-content">
                <img src={Icon} alt="Loading" className="loader-icon" />
                <p className="loader-text">Loading...</p>
            </div>
        </div>
    );
};

export default LoaderComponent;