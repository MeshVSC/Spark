import React from "react";

interface ProgressCircleProps {
  completion: number;
  size?: number;
}

const ProgressCircle: React.FC<ProgressCircleProps> = ({ completion, size = 16 }) => {
  const radius = size / 2 - 2;
  const center = size / 2;
  const strokeWidth = 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (completion / 100) * circumference;

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg className="w-full h-full -rotate-90" viewBox={`0 0 ${size} ${size}`}>
        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth={strokeWidth}
        />

        {/* Progress stroke */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#007AFF"
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
};

export default ProgressCircle;
