import React, {useEffect, useState} from 'react';
import {Moon,Sun} from 'lucide-react';

export default function DarkModeToggle() {
    const [theme, setTheme] = useState(localStorage.getItem('theme')||'light');
    useEffect(()=> {
        document.documentElement.setAttribute('data-theme',theme);
        localStorage.setItem('theme',theme);
    },[theme]);

    return (
        <div className="absolute top-4 right-4">
            <button className={`cursor-pointer bg-gray-200 dark:bg-gray-800 rounded-full transition duration-300 ease-in-out p-2 ${theme==='light'?'hover:bg-gray-300':'hover:bg-gray-700'}`}
            onClick={()=>setTheme(theme==='light'?'dark':'light')}>
                {theme==='light'?<Moon size={24} className="text-cyan-400"/>:<Sun size={24} className="text-yellow-400"/>}
            </button>
        </div>
    )
}