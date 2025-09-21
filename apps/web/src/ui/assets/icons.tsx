/**
 * SVG 아이콘 컴포넌트 모음
 * React 컴포넌트로 SVG 아이콘을 제공하여 Tailwind CSS 내 SVG URL 사용 문제 해결
 */

import React from 'react';

interface IconProps {
  size?: number;
  className?: string;
}

/**
 * A React component for a tower pattern SVG icon.
 * Used as a repeatable background pattern.
 *
 * @param {IconProps} props - The component props.
 * @returns {React.ReactElement} The rendered SVG icon.
 */
export function TowerPatternIcon({ size = 40, className = '' }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      className={`repeat ${className}`}
      style={{ opacity: 0.05 }}
    >
      <g fill="none" fillRule="evenodd">
        <g fill="#facc15" fillOpacity="0.05">
          <path d="M20 20c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10zm10 0c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10z"/>
        </g>
      </g>
    </svg>
  );
}

/**
 * A React component for a tower map pattern SVG icon.
 * Used as a repeatable background pattern.
 *
 * @param {IconProps} props - The component props.
 * @returns {React.ReactElement} The rendered SVG icon.
 */
export function TowerMapPatternIcon({ size = 60, className = '' }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 60 60"
      className={`repeat ${className}`}
      style={{ opacity: 0.1 }}
    >
      <g fill="none" fillRule="evenodd">
        <g fill="#facc15" fillOpacity="0.1">
          <path d="m36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/>
        </g>
      </g>
    </svg>
  );
}

/**
 * Generates a data URL for the tower pattern SVG.
 * This is useful for embedding the SVG as a background image in CSS.
 * @returns {string} The data URL for the SVG.
 */
export const getTowerPatternDataURL = () => {
  return `data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23facc15' fill-opacity='0.05'%3E%3Cpath d='M20 20c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10zm10 0c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E`;
};

/**
 * Generates a data URL for the tower map pattern SVG.
 * This is useful for embedding the SVG as a background image in CSS.
 * @returns {string} The data URL for the SVG.
 */
export const getTowerMapPatternDataURL = () => {
  return `data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23facc15' fill-opacity='0.1'%3E%3Cpath d='m36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E`;
};