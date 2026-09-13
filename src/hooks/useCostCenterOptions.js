import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../services/api";

const useCostCenterOptions = () => {
  const [costCenters, setCostCenters] = useState([]);
  const [accessMode, setAccessMode] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadCostCenters = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/cost-centres/list");
      const rows = Array.isArray(response.data?.data) ? response.data.data : [];
      setCostCenters(rows.filter((row) => row?.is_active !== false));
      setAccessMode(response.data?.access_mode || "all");
    } catch (requestError) {
      setCostCenters([]);
      setError(requestError.response?.data?.message || "Cost centres could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCostCenters();
  }, [loadCostCenters]);

  const options = useMemo(
    () => costCenters.map((row) => ({
      value: String(row.name || "").trim(),
      label: String(row.name || "").trim(),
      id: Number(row.id || 0),
    })).filter((option) => option.value),
    [costCenters]
  );

  return {
    costCenters,
    options,
    accessMode,
    loading,
    error,
    reload: loadCostCenters,
  };
};

export default useCostCenterOptions;
