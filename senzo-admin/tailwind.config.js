/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#5B7CFF',
                    foreground: '#FFFFFF',
                },
                secondary: {
                    DEFAULT: '#8B5CF6',
                    foreground: '#FFFFFF',
                },
                success: '#10B981',
                danger: '#EF4444',
                warning: '#F59E0B',
                background: '#0A0D14',
                surface: '#13161E',
                border: '#1F242E',
            },
        },
    },
    plugins: [],
}
