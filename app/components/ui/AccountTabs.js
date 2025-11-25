'use client';
import React, { useState } from 'react';

const AccountTabs = ({ children }) => {
  const [activeTab, setActiveTab] = useState('profile'); // Default active tab

  const tabs = [
    { id: 'profile', label: 'Profile' },
    { id: 'addresses', label: 'Addresses' },
    // Add more tabs as needed
  ];

  return (
    <div className="p-4">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex overflow-x-auto whitespace-nowrap gap-x-4" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              } whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-8">
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child) && child.props.id === activeTab) {
            return child;
          }
          return null;
        })}
      </div>
    </div>
  );
};

const TabContent = ({ id, children }) => {
  return <div id={id}>{children}</div>;
};

export { AccountTabs, TabContent };
