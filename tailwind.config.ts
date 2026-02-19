import type { Config } from 'tailwindcss'

export default {
	darkMode: ['class'],
	content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
	theme: {
		extend: {
			container: {
				center: true,
				padding: '2rem'
			},
			colors: {
				background: 'hsl(var(--background))',
				surface: {
					DEFAULT: 'hsl(var(--surface))',
					elevated: 'hsl(var(--surface-elevated))',
					hover: 'hsl(var(--surface-hover))'
				},
				foreground: {
					DEFAULT: 'hsl(var(--foreground))',
					muted: 'hsl(var(--foreground-muted))',
					subtle: 'hsl(var(--foreground-subtle))'
				},
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))',
					hover: 'hsl(var(--primary-hover))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				success: 'hsl(var(--success))',
				danger: 'hsl(var(--danger))',
				warning: 'hsl(var(--warning))',
				info: 'hsl(var(--info))',
				border: {
					DEFAULT: 'hsl(var(--border))',
					hover: 'hsl(var(--border-hover))'
				},
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				chart: {
					'1': 'hsl(var(--chart-1))',
					'2': 'hsl(var(--chart-2))',
					'3': 'hsl(var(--chart-3))',
					'4': 'hsl(var(--chart-4))',
					'5': 'hsl(var(--chart-5))'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			}
		}
	},
	plugins: [require("tailwindcss-animate")]
} satisfies Config
