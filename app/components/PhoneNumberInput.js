import React, { useState, useEffect } from 'react';
import CountryCodeSelect from './CountryCodeSelect';
import { Input } from './ui/input'; // Assuming 'Input' is the generic input component

const PhoneNumberInput = ({ value, onChange, disabled, required }) => {
  // Find the initial country code and local number from the full phone number 'value'
  const getInitialValues = (fullPhoneNumber) => {
    if (!fullPhoneNumber) {
      return {
        code: '+971', // Always UAE
        number: ''
      };
    }
    // Assuming the number always starts with +971 if a value exists
    if (fullPhoneNumber.startsWith('+971')) {
      return {
        code: '+971',
        number: fullPhoneNumber.substring(4) // +971 is 4 characters long
      };
    }
    // Fallback, if it doesn't start with +971, we'll still use +971 and treat the whole thing as local number
    return {
      code: '+971',
      number: fullPhoneNumber
    };
  };

  const countryCode = '+971'; // Fixed value, no longer state
  const [localNumber, setLocalNumber] = useState(() => getInitialValues(value).number);

  useEffect(() => {
    // Update internal state if the external 'value' prop changes
    const { number } = getInitialValues(value);
    setLocalNumber(number); // Unconditionally set from external value
  }, [value]); // Only depend on 'value'

  const emitChange = (newCountryCode, newLocalNum) => {
    if (onChange) {
      onChange({ target: { name: 'customer_phone', value: newCountryCode + newLocalNum } });
    }
  };

  const handleCountryCodeChange = (e) => {
    // This function remains largely the same, but for completeness, it's good to re-emit with new code
    const newCode = e.target.value;
    // setCountryCode(newCode); // countryCode is fixed, no need to set state
    emitChange(newCode, localNumber); // Pass newCode directly
  };

  const handleLocalNumberChange = (e) => {
    const newLocalNum = e.target.value;
    // Re-add digit-only validation
    if (/^\d*$/.test(newLocalNum)) {
      setLocalNumber(newLocalNum);
      emitChange(countryCode, newLocalNum);
    }
    // Remove console.log after debugging
  };

  return (
    <div className="flex items-center space-x-2 mb-6">
      <div className="w-1/3 flex-shrink-0"> {/* Country Code Select */}
        <CountryCodeSelect
          value="+971" // Fixed value
          onChange={() => {}} // No-op, as it's disabled
          disabled={true} // Always disabled
        />
      </div>
      <div className="w-2/3"> {/* Local Number Input */}
        <Input
          type="tel"
          value={localNumber}
          onChange={handleLocalNumberChange}
          placeholder="e.g. 5XXXXXXXX"
          required={required}
          disabled={disabled}
          className="block w-full px-3 py-2 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[var(--brand-pink)] focus:border-[var(--brand-pink)] sm:text-sm"
        />
      </div>
    </div>
  );
};

export default PhoneNumberInput;