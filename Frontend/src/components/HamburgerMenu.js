import React, { useState } from 'react';
import { FiMenu, FiX } from 'react-icons/fi';

export default function HamburgcerMenu() {
  const [isOpen, setIsOpen] = useState(false);

  const handleMenuToggle = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="absolute max-md:mt-[10px] mt-[32px] ml-[0.1px] z-[9999999999999999999999999] max-sm:ml-[1.3%] max-md:ml-[1%] hidden max-md:block">
      <button
        type="button"
        className="text-black focus:outline-none"
        onClick={handleMenuToggle}
      >
        {isOpen ? (
          <FiX className="w-5 h-5 max-sm:w-3.5 max-sm:h-3.5 max-md:w-5 max-md:h-5" />
        ) : (
          <FiMenu className="w-5 h-5 max-sm:w-3.5 max-sm:h-3.5 max-md:w-5 max-md:h-5" />
        )}
      </button>
      {isOpen && (
        <div className="absolute ml-0 top-[20px] max-md:w-[9rem] max-sm:w-[7rem] px-1 shadow-[0_0px_3px_0px_rgb(0,0,0)] bg-slate-300 z-[99999999999999999999999999999999] max-md:text-xs sm:text-sm">
          <ul className="py-1 ml-[20%]">
            <li>
              <a
                href="#"
                className="block py-1 text-red-950 hover:bg-gray-100"
                onClick={handleMenuToggle}
              >
                {"地番検索"}
              </a>
            </li>
            <li>
              <a
                href="#"
                className="block py-1 text-red-950 hover:bg-gray-100"
                onClick={handleMenuToggle}
              >
                {"不動産ID検索"}
              </a>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
