import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import NavBar from "../NavBar";
import Header from "../Header";
import useThemeStore from "../../stores/useThemeStore";
import { motion } from "framer-motion";
import { fadeInUp } from "../../utils/animation";
import PageNav from "../../components/PageNav";
import useToastStore from "../../stores/useToastStore";
import useProjectStore from "../../stores/useProjectStore";
import EditLoaderComponent from "../../components/EditLoaderComponent";
import ViewProjectContent from "./ViewProjectContent";

const ViewProject = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { theme } = useThemeStore();
  const { showToast } = useToastStore();
  const [nav, setNav] = useState(false);

  // Consume states from useProjectStore
  const { 
    singleProject: projectData, 
    fetchingSingle: isLoading, 
    singleProjectError: fetchError, 
    fetchSingleProject 
  } = useProjectStore();

  const links = [
    { label: "Home", to: "/", active: true },
    { label: "Projects", to: "/project/home", active: true },
    { label: "Details", to: "/", active: false },
  ];

  useEffect(() => {
    document.title = "Smartbooks | View Project";
    
    // 1. Basic format check
    const parsedId = parseInt(projectId, 10);
    if (!projectId || isNaN(parsedId) || parsedId <= 0) {
      showToast("Invalid project ID. Redirecting…", "error");
      navigate("/project/home");
      return;
    }

    // 2. Fetch data using the store action
    fetchSingleProject(parsedId);
  }, [projectId]);

  // 3. Handle fetch error by redirecting (toast is already shown by the store)
  useEffect(() => {
    if (fetchError) {
      navigate("/project/home");
    }
  }, [fetchError]);

  if (fetchError) {
    return null; // Prevent flash of content while redirecting
  }

  return (
    <div className={`main-container theme-${theme}`}>
      <Header setNav={setNav} nav={nav} />
      <NavBar setNav={setNav} nav={nav} />

      <div className={`content-container theme-${theme}`}>
        <PageNav pageTitle="Projects" links={links} />

        {isLoading ? (
          <EditLoaderComponent text={'Loading Project...'} />
        ) : projectData ? (
          // Pass the fetched data directly to the child
          <ViewProjectContent project={projectData} />
        ) : null}
      </div>
    </div>
  );
};

export default ViewProject;