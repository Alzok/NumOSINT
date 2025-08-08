import React from 'react';

export const HeartbeatIcon = ({ className }: { className?: string }) => {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 60 40" // Shorter viewBox
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <style>
        {`
          .path {
            stroke-dasharray: 200;
            stroke-dashoffset: 200;
            animation: draw 2s infinite linear;
          }

          @keyframes draw {
            to {
              stroke-dashoffset: 0;
            }
          }
        `}
      </style>
      <path
        className="path"
        d="M0 20 H10 L15 10 L20 30 L25 15 L30 20 H60" // Shorter path
      />
    </svg>
  );
};