'use client';

import React, { useRef, useEffect } from 'react';

const AutoResizeTextarea = ({ value, onChange, ...props }) => {
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'; // Reset height to auto to calculate new scrollHeight
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [value]); // Re-run effect when value changes

  return (
    <textarea
      {...props}
      ref={textareaRef}
      value={value}
      onChange={onChange}
      style={{
        minHeight: '40px', // Set a minimum height
        resize: 'none',    // Disable manual resizing by user
        overflow: 'hidden' // Hide scrollbar
      }}
    />
  );
};

export default AutoResizeTextarea;
