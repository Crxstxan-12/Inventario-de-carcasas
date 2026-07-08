import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltan las variables de entorno de Supabase')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const IPHONE_MODELS = {
  'iPhone 11': ['iPhone 11', 'iPhone 11 Pro', 'iPhone 11 Pro Max'],
  'iPhone 12': ['iPhone 12 mini', 'iPhone 12', 'iPhone 12 Pro Max', 'iPhone 12 Pro Max'],
  'iPhone 13': ['iPhone 13 mini', 'iPhone 13', 'iPhone 13 Pro', 'iPhone 13 Pro Max'],
  'iPhone 14': ['iPhone 14', 'iPhone 14 Plus', 'iPhone 14 Pro', 'iPhone 14 Pro Max'],
  'iPhone 15': ['iPhone 15', 'iPhone 15 Plus', 'iPhone 15 Pro', 'iPhone 15 Pro Max'],
  'iPhone 16': ['iPhone 16', 'iPhone 16 Plus', 'iPhone 16 Pro', 'iPhone 16 Pro Max', 'iPhone 16e'],
  'iPhone 17': ['iPhone 17', 'iPhone 17e', 'iPhone 17 Pro', 'iPhone 17 Pro Max', 'iPhone Air']
}

export const CASE_TYPES = [
  'Transparente',
  'Silicona',
  'Antigolpes',
  'MagSafe',
  'Acrílica',
  'Estampada',
  'Ecocuero',
  'Bumper',
  'Cámara protegida',
  'Premium'
]

export const MOVEMENT_TYPES = [
  'entrada',
  'venta',
  'ajuste',
  'devolucion',
  'dañado',
  'perdido'
]
