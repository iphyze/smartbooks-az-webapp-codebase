
import React, { useState, useEffect } from "react";
import NavBar from "../NavBar";
import Header from "../Header";
import 'aos/dist/aos.css';
import useThemeStore from "../../stores/useThemeStore";
import LoaderComponent from "../../components/LoaderComponent";
import { motion } from "framer-motion";
import { fadeIn, fadeInUp, fadeInDown } from "../../utils/animation";


const BasicPageTemplate = () => {
  const [nav, setNav] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const {theme} = useThemeStore();


  useEffect(() => {
    // Set the page title
    document.title = "Digital Invoice Naija | BasicPageTemplate";

    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);


  if (isLoading) {
    return <LoaderComponent />
  }


  return(
    <div className={`main-container theme-${theme}`}>
      <Header setNav={setNav} nav={nav}/>
      <NavBar setNav={setNav} nav={nav}/>
      
      <div className={`content-container theme-${theme}`}>
        
      </div>

    </div>
  );
};

export default BasicPageTemplate;