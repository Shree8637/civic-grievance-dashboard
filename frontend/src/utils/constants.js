/**
 * Shared constants — categories, statuses, colors
 */

export const CATEGORIES = [
  { value: 'garbage',      label: 'Garbage',       icon: 'Trash2',    color: '#6B8E23' },
  { value: 'water_supply', label: 'Water Supply',  icon: 'Droplet',   color: '#4682B4' },
  { value: 'drainage',     label: 'Drainage',      icon: 'Waves',     color: '#708090' },
  { value: 'roads',        label: 'Roads',         icon: 'Route',     color: '#8B4513' },
  { value: 'streetlights', label: 'Streetlights',  icon: 'Lightbulb', color: '#DAA520' },
  { value: 'other',        label: 'Other',         icon: 'HelpCircle',color: '#7B68EE' },
];

export const STATUSES = [
  { value: 'submitted',   label: 'Submitted',    color: '#D64550' },
  { value: 'in_progress', label: 'In Progress',  color: '#E9A23B' },
  { value: 'resolved',    label: 'Resolved',     color: '#2A9D8F' },
];

export const getCategoryByValue = (value) =>
  CATEGORIES.find((c) => c.value === value) || CATEGORIES[5]; // fallback to 'other'

export const getStatusByValue = (value) =>
  STATUSES.find((s) => s.value === value) || STATUSES[0];
