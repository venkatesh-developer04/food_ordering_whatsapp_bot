import { createContext, useContext, useState, useEffect } from 'react';
import { settingsAPI } from '../api';

const SettingsContext = createContext();

export function SettingsProvider({ children }) {
    const [settings, setSettings] = useState(null);

    useEffect(() => {
        settingsAPI.get().then(res => setSettings(res.data)).catch(console.error);
    }, []);

    const updateSettings = async (newSettings) => {
        try {
            const res = await settingsAPI.update(newSettings);
            setSettings(res.data);
            return res.data;
        } catch (err) {
            console.error('Failed to update settings:', err);
            throw err;
        }
    };

    return (
        <SettingsContext.Provider value={{ settings, updateSettings, isLoaded: !!settings }}>
            {children}
        </SettingsContext.Provider>
    );
}

export const useSettings = () => useContext(SettingsContext);
