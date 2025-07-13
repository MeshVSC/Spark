import { useState } from "react";

interface CustomCheckboxProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  className?: string;
}

export function CustomCheckbox({ checked = false, onChange, className = "" }: CustomCheckboxProps) {
  const [isChecked, setIsChecked] = useState(checked);

  const handleClick = () => {
    const newValue = !isChecked;
    setIsChecked(newValue);
    onChange?.(newValue);
  };

  return (
    <div 
      className={`w-3 h-3 rounded border transition-all duration-150 flex items-center justify-center cursor-pointer ${className}`}
      style={{ 
        backgroundColor: isChecked ? '#90B1F6' : 'white',
        borderColor: isChecked ? '#90B1F6' : 'var(--things-gray-300)',
        borderWidth: '1px'
      }}
      onClick={handleClick}
    >
      <svg 
        width="8" 
        height="8" 
        viewBox="0 0 24 24" 
        fill="none" 
        className={`transition-opacity duration-150 ${isChecked ? 'opacity-100' : 'opacity-0'}`}
      >
        <polyline points="20,6 9,17 4,12" stroke="white" strokeWidth="3" fill="none"/>
      </svg>
    </div>
  );
}