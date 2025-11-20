import React from 'react';

const CountryCodeSelect = ({ value, onChange, disabled }) => {
  return (
    <select
      value={value}
      onChange={onChange}
      disabled={disabled}
      className="block w-full py-2 pl-3 pr-8 text-sm rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-[var(--brand-pink)] focus:border-[var(--brand-pink)]"
    >
      <option value="+971">+971</option>
    </select>
  );
};

export default CountryCodeSelect;