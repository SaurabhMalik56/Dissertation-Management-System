import React from 'react';

const Loader = ({ size = 'medium', text = 'Loading...' }) => {
  const sizeClass = {
    small: 'h-8 w-8',
    medium: 'h-12 w-12',
    large: 'h-16 w-16'
  };

  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className={`animate-spin rounded-full ${sizeClass[size]} border-t-2 border-b-2 border-indigo-500`}></div>
      {text && <p className="mt-4 text-indigo-600 font-medium">{text}</p>}
    </div>
  );
};

export default Loader; 