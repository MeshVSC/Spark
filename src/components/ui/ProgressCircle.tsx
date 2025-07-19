import React from "react";

interface ProgressCircleProps {
  completion: number;
  size?: number;
}

const ProgressCircle: React.FC<ProgressCircleProps> = ({ completion, size = 16 }) => {
  const center = size / 2;
  const outerRadius = size / 2;
  const borderWidth = 1.5;
  const gapWidth = 1;
  const innerRadius = outerRadius - borderWidth - gapWidth;
  
  // Colors
  const fillColor = '#E5E7EB'; // "Dark gray" for both pie fill and border
  const backgroundColor = '#F9FAFB'; // Background color for gap and empty areas
  
  // Create pie slice path for completion
  const createPieSlice = (percentage: number) => {
    if (percentage === 0) return '';
    if (percentage >= 100) {
      // Full circle
      return `M ${center},${center} m -${innerRadius},0 a ${innerRadius},${innerRadius} 0 1,0 ${innerRadius * 2},0 a ${innerRadius},${innerRadius} 0 1,0 -${innerRadius * 2},0`;
    }
    
    const angle = (percentage / 100) * 360;
    const radians = ((angle - 90) * Math.PI) / 180; // Start from top
    const largeArcFlag = angle > 180 ? 1 : 0;
    const endX = center + innerRadius * Math.cos(radians);
    const endY = center + innerRadius * Math.sin(radians);
    
    return `M ${center} ${center} L ${center} ${center - innerRadius} A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 1 ${endX} ${endY} Z`;
  };

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg className="w-full h-full" viewBox={`0 0 ${size} ${size}`}>
        {/* 1. Background circle (shows through as gap) */}
        <circle
          cx={center}
          cy={center}
          r={outerRadius}
          fill={backgroundColor}
        />
        
        {/* 2. Outer ring border */}
        <circle
          cx={center}
          cy={center}
          r={outerRadius - borderWidth/2}
          fill="none"
          stroke={fillColor}
          strokeWidth={borderWidth}
        />
        
        {/* 3. Inner circle background */}
        <circle
          cx={center}
          cy={center}
          r={innerRadius}
          fill={backgroundColor}
        />
        
        {/* 4. Progress pie slice fill */}
        {completion > 0 && (
          <path
            d={createPieSlice(completion)}
            fill={fillColor}
          />
        )}
      </svg>
    </div>
  );
};

export default ProgressCircle;
