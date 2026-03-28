import React, { useState, useEffect } from "react";
import NavBar from "../../NavBar";
import Header from "../../Header";
import { NavLink } from "react-router-dom";
import 'aos/dist/aos.css';
import AOS from 'aos';
import useThemeStore from "../../../stores/useThemeStore";
import Icon from "../../../assets/images/ico.png";

const BankLetter = () => {

  const [nav, setNav] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { theme } = useThemeStore();

  useEffect(() => {
      AOS.init({
        duration: 1000,
        offset: 100,
        easing: 'ease-in-out',
        once: true,
      });
  
      document.title = "Acctlab | Bank Letter";
  
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 1000);
  
      return () => clearTimeout(timer);
    }, []);
  
    if (isLoading) {
      return (
        <div className={`loader-container theme-${theme}`}>
          <div className="loader-content">
            {/* <div className="loader-spinner"></div> */}
            <img src={Icon} alt="Loading" className="loader-icon" />
            <p className="loader-text">Loading...</p>
          </div>
        </div>
      );
    }

  return(

    <div className={`main-container theme-${theme}`}>
    <Header setNav={setNav} nav={nav}/>
    <NavBar setNav={setNav} nav={nav}/>
    
    <div className={`content-container theme-${theme}`}>
      <div className="content-container-h-flexbox" data-aos='fade-down'>
        <div className="cch-flexbox">
          {/* <span className="cch-iconbox"><i className="fas fa-home cch-icon"></i></span> */}
          <p className="content-header">Bank Letter</p>
        </div>
        <div className="cch-title-box">
          <NavLink to='/' className="ccht-titlelink">Letters</NavLink>
          <span className="ccht-arrow fas fa-chevron-right"></span>
          <p className="ccht-titletext">Home</p>
        </div>
      </div>
    </div>
  </div>

  )

};

export default BankLetter;
