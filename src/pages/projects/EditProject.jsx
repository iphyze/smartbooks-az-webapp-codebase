import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import NavBar from "../NavBar";
import Header from "../Header";
import useThemeStore from "../../stores/useThemeStore";
import PageNav from "../../components/PageNav";
import EditProjectForm from "./EditProjectForm";
import useToastStore from "../../stores/useToastStore";
import useProjectStore from "../../stores/useProjectStore";
import EditLoaderComponent from "../../components/EditLoaderComponent";

const EditProject = () => {
  const { id } = useParams();
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
    { label: "Edit Project", to: "/project/edit", active: false },
  ];

  useEffect(() => {
    document.title = "Smartbooks | Edit Project";
    
    // 1. Basic format check
    const parsedId = parseInt(id, 10);
    if (!id || isNaN(parsedId) || parsedId <= 0) {
      showToast("Invalid project ID. Redirecting…", "error");
      navigate("/project/home");
      return;
    }

    // 2. Fetch data using the store action
    fetchSingleProject(parsedId);
  }, [id]);

  // 3. Handle fetch error by redirecting (toast is already shown by the store)
  useEffect(() => {
    if (fetchError) {
      navigate("/project/home");
    }
  }, [fetchError]);

  const handleSaveSuccess = () => {
    // Optional: Redirect or show success message after save
  };

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
          <EditProjectForm
            projectId={projectData.id}
            project={projectData}
            onSaveSuccess={handleSaveSuccess}
          />
        ) : null}
      </div>
    </div>
  );
};

export default EditProject;