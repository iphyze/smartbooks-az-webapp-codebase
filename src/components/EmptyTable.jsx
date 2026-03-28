import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { fadeInUp } from "../utils/animation";
import useThemeStore from "../stores/useThemeStore";

const EmptyTable = ({icon, message, link}) => {
    const { theme } = useThemeStore();

    return (
        <motion.div variants={fadeInUp} initial="hidden" animate="show"
            transition={{ duration: 0.3, delay: 0.2, ease: "easeInOut" }}
            className={`empty-table-box theme-${theme}`}>
                <i className={`${icon} empty-table-icon`}></i>
                <p className="empty-table-text">{message}</p>
                <Link to={link} className="invoice-create-btn">
                    <span className="fas fa-circle-plus inv-create-btn-icon"></span>
                    <span className="inv-create-btn-text">Create New</span>
                </Link>
        </motion.div>
    );
};

export default EmptyTable;
