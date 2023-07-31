import React, { useState } from 'react';
import { FiMenu, FiX } from 'react-icons/fi';

export default function MenuSearchButton() {
    const [isOpen, setIsOpen] = useState(false);
  
    const handleMenuToggle = () => {
      setIsOpen(!isOpen);
    };
  
    return (
      <div className="relative flex-grow z-[9999999999999999999999999] flex-row-reverse px-1">
        <button
          type="button"
          className="text-black focus:outline-none ml-autos"
          onClick={handleMenuToggle}
        >
          {isOpen ? (
            <FiX className="w-8 h-8 max-sm:w-5 max-sm:h-5 max-md:w-6 max-md:h-6" />
          ) : (
            <FiMenu className="w-8 h-8 max-sm:w-5 max-sm:h-5 max-md:w-6 max-md:h-6" />
          )}
        </button>
        {isOpen && (
          <div className="bg-slate-100 absolute right-0 top-[68px] max-sm:top-[42px] w-[12rem] px-1 shadow-[0_0px_3px_0px_rgb(0,0,0)] bg-white z-[99999999999999999999999999999999] max-md:text-xs sm:text-sm">
            <ul className="py-1 ml-[20%]">
              <li>
                <a
                  href="#"
                  className="block py-1 text-red-950 hover:bg-gray-100"
                >
                  {"利用規約"}
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="block py-1 text-red-950 hover:bg-gray-100"
                >
                  {"ヘルプ"}
                </a>
              </li>
            </ul>
          </div>
        )}
      </div>
    );
  }