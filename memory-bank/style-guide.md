# SiYuan Plugin Style Guide

## Color Palette
### Primary Colors
- **Primary Blue**: #3b82f6 (SiYuan accent)
- **Secondary Gray**: #6b7280 (UI elements)
- **Success Green**: #10b981 (positive status)
- **Warning Orange**: #f59e0b (caution)
- **Error Red**: #ef4444 (errors)
- **Info Blue**: #06b6d4 (information)

### Neutral Colors
- **Background**: #ffffff (light mode), #1f2937 (dark mode)
- **Surface**: #f9fafb (light mode), #374151 (dark mode) 
- **Border**: #e5e7eb (light mode), #4b5563 (dark mode)
- **Text Primary**: #111827 (light mode), #f9fafb (dark mode)
- **Text Secondary**: #6b7280 (both modes)

## Typography
### Font Families
- **Primary**: Inter, system-ui, sans-serif
- **Monospace**: 'JetBrains Mono', monospace

### Font Sizes (Tailwind)
- **Title**: text-lg (18px)
- **Body**: text-sm (14px)
- **Label**: text-xs (12px)
- **Caption**: text-xs (12px)

## Spacing System (Tailwind)
- **Base unit**: 4px (space-1)
- **Small**: 8px (space-2)
- **Medium**: 16px (space-4)
- **Large**: 24px (space-6)
- **XLarge**: 32px (space-8)

## Component Styles
### Buttons
- **Primary**: bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md
- **Secondary**: bg-gray-200 hover:bg-gray-300 text-gray-900 px-4 py-2 rounded-md
- **Danger**: bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md

### Inputs
- **Text**: border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500
- **Password**: Same as text + type=password

### Cards
- **Container**: bg-white border border-gray-200 rounded-lg p-4 shadow-sm

### Status Indicators
- **Connected**: text-green-600 с иконкой wifi
- **Disconnected**: text-red-600 с иконкой wifi-off
- **Loading**: text-yellow-600 с spinner

### Icons (SiYuan compatible)
- **Settings**: gear/cog icon
- **Connection**: wifi/signal icon
- **Security**: shield icon
- **Port**: network/server icon

## Accessibility
- **Focus management**: Tab navigation support
- **Screen reader**: ARIA labels на всех controls
- **Color contrast**: Minimum AA compliance
- **Keyboard shortcuts**: ESC для closing modal

## Responsive Design
- **Desktop**: Full modal width (400-500px)
- **Mobile**: Full screen modal
- **Status indicator**: Always compact (24px height)