import React, { useState } from "react";
import NavBar from "../NavBar";
import Header from "../Header";
import { NavLink } from "react-router-dom";

const Users = () => {

  const [nav, setNav] = useState(false);

  return(

  <div className="main-container">
    <Header setNav={setNav} nav={nav}/>
    <NavBar setNav={setNav} nav={nav}/>
    <div className="content-container">
      <div className="content-container-h-flexbox">
          <div className="cch-flexbox">
            <span className="cch-iconbox"><i className="fas fa-users cch-icon"></i></span>
            <p className="content-header">Users</p>
          </div>
          <div className="cch-title-box">
            <NavLink to='/users' className="ccht-titlelink">Users</NavLink>
            <p className="ccht-titletext"> / Home</p>
          </div>
      </div>


    </div>
  </div>

  )

};

export default Users;
