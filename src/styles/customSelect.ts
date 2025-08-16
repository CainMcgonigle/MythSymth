export const customSelectStyles = {
  control: (provided: any, state: any) => ({
    ...provided,
    backgroundColor: "#1f2937", 
    borderColor: state.isFocused ? "#2563eb" : "#374151", 
    boxShadow: state.isFocused ? "0 0 0 1px #2563eb" : "none",
    "&:hover": {
      borderColor: "#2563eb",
    },
    color: "white",
    minHeight: "38px",
  }),
  menu: (provided: any) => ({
    ...provided,
    backgroundColor: "#1f2937", 
    color: "white",
  }),
  option: (provided: any, state: any) => ({
    ...provided,
    backgroundColor: state.isFocused
      ? "#2563eb"
      : state.isSelected
        ? "#1e40af"
        : "transparent",
    color: state.isFocused || state.isSelected ? "white" : "#d1d5db", 
    cursor: "pointer",
  }),
  singleValue: (provided: any) => ({
    ...provided,
    color: "white",
  }),
  dropdownIndicator: (provided: any) => ({
    ...provided,
    color: "#9ca3af", 
    "&:hover": {
      color: "#2563eb", 
    },
  }),
  indicatorSeparator: (provided: any) => ({
    ...provided,
    backgroundColor: "#374151", 
  }),
  placeholder: (provided: any) => ({
    ...provided,
    color: "#9ca3af", 
  }),
};
