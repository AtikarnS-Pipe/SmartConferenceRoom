import { useState, useEffect } from "react";

export default function Switch() {
  const [isOn, setIsOn] = useState(false);

  useEffect(() => {
    let timer;
    if (isOn) {
      timer = setTimeout(() => {
        setIsOn(false);
      }, 10000); // 5 วินาที
    }
    return () => clearTimeout(timer);
  }, [isOn]);

  return (
    <button
      onClick={() => setIsOn(true)}
      className={`w-16 h-8 flex items-center rounded-full p-1 transition-colors duration-300 ${
        isOn ? "bg-green-500" : "bg-gray-300"
      }`}
    >
      <div
        className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 ${
          isOn ? "translate-x-8" : "translate-x-0"
        }`}
      />
    </button>
  );
}
