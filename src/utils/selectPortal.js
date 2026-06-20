/**
 * Renders react-select menus outside scrollable panels/modals so options remain
 * visible and clickable inside dynamic rows, drawers and edit dialogues.
 */
export const getPortalSelectProps = (theme = 'light') => {
  const darkMode = theme === 'dark';
  const palette = darkMode
    ? {
        surface: '#111b27',
        border: '#2a3949',
        text: '#eef4f8',
        muted: '#98a8b9',
        hover: '#152635',
        selected: '#13c0ad',
        selectedText: '#ffffff',
        shadow: '0 28px 70px rgba(0, 0, 0, .48)',
      }
    : {
        surface: '#ffffff',
        border: '#dbe4ef',
        text: '#101828',
        muted: '#66748b',
        hover: '#f2f7fa',
        selected: '#099e91',
        selectedText: '#ffffff',
        shadow: '0 24px 55px rgba(15, 23, 42, .14)',
      };

  return {
    menuPortalTarget: typeof document !== 'undefined' ? document.body : undefined,
    menuPosition: 'fixed',
    menuShouldScrollIntoView: false,
    styles: {
      menuPortal: (base) => ({ ...base, zIndex: 24000 }),
      menu: (base) => ({
        ...base,
        marginTop: 7,
        padding: 6,
        border: `1px solid ${palette.border}`,
        borderRadius: 13,
        backgroundColor: palette.surface,
        boxShadow: palette.shadow,
        overflow: 'hidden',
      }),
      menuList: (base) => ({ ...base, padding: 0, maxHeight: 250 }),
      option: (base, state) => ({
        ...base,
        margin: '2px 0',
        padding: '10px 11px',
        borderRadius: 9,
        color: state.isSelected ? palette.selectedText : palette.text,
        backgroundColor: state.isSelected
          ? palette.selected
          : state.isFocused
            ? palette.hover
            : 'transparent',
        cursor: 'pointer',
      }),
      noOptionsMessage: (base) => ({ ...base, color: palette.muted }),
      loadingMessage: (base) => ({ ...base, color: palette.muted }),
    },
  };
};
