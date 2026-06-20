import React from 'react';
import Select from 'react-select';
import useThemeStore from '../../../stores/useThemeStore';
import { getPortalSelectProps } from '../../../utils/selectPortal';

const ReconSelect = ({ options = [], value, onChange, className = '', isSearchable = false, placeholder = 'Select…' }) => {
  const { theme } = useThemeStore();
  const selected = options.find((option) => option.id === value) || null;

  return (
    <Select
      options={options}
      value={selected}
      onChange={(option) => onChange(option?.id || '')}
      getOptionLabel={(option) => option.label}
      getOptionValue={(option) => String(option.id)}
      className={`react-select br-react-select ${className}`.trim()}
      classNamePrefix="select"
      placeholder={placeholder}
      isSearchable={isSearchable}
      isClearable={false}
      {...getPortalSelectProps(theme)}
    />
  );
};

export default ReconSelect;
