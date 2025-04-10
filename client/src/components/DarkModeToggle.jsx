import React, {useEffect, useState} from 'react';
import {Moon,Sun} from 'lucide-react';

export default function DarkModeToggle() {
    const [theme, setTheme] = useState(localStorage.getItem('theme')||'light');
        useEffect(() => {
            document.documentElement.setAttribute('data-theme', theme);
            if (theme === 'dark') {
              document.documentElement.classList.add('dark');
            } else {
              document.documentElement.classList.remove('dark');
            }
            localStorage.setItem('theme', theme);
          }, [theme]);
          

    return (
        <div className="absolute top-4 right-4 hover:scale-110 transition duration-500 ease-in-out rounded-full">
            <button className={`cursor-pointer dark:bg-gray-800 rounded-full transition duration-300 ease-in-out p-2 ${theme==='light'?'hover:bg-yellow-50':'hover:bg-gray-700'}`}
            onClick={()=>setTheme(theme==='light'?'dark':'light')}>
                {theme!=='light'?<Moon size={32} className="text-cyan-100"/>:<Sun size={32} className="text-yellow-400"/>}
            </button>
        </div>
    )
}