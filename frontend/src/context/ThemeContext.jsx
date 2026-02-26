import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

const THEMES = [
    { id: 'default', label: 'Saffron', color: '#f97316' },
    { id: 'ocean', label: 'Ocean', color: '#06b6d4' },
    { id: 'emerald', label: 'Emerald', color: '#10b981' },
    { id: 'violet', label: 'Violet', color: '#8b5cf6' },
    { id: 'rose', label: 'Rose', color: '#f43f5e' },
    { id: 'amber', label: 'Amber', color: '#f59e0b' },
];

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState(() => localStorage.getItem('vk-theme') || 'default');

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme === 'default' ? '' : theme);
        localStorage.setItem('vk-theme', theme);
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, setTheme, THEMES }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => useContext(ThemeContext);
