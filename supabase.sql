-- 1. Tabla de perfiles de usuario (para roles)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'vendedor' CHECK (role IN ('administrador', 'vendedor')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabla de modelos de iPhone
CREATE TABLE IF NOT EXISTS public.iphone_models (
    id SERIAL PRIMARY KEY,
    family TEXT NOT NULL,
    model TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabla de tipos de carcasa
CREATE TABLE IF NOT EXISTS public.case_types (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabla de carcasas (inventario principal)
CREATE TABLE IF NOT EXISTS public.carcasas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    iphone_model_id INTEGER REFERENCES public.iphone_models(id) ON DELETE RESTRICT,
    iphone_family TEXT NOT NULL,
    case_type_id INTEGER REFERENCES public.case_types(id) ON DELETE RESTRICT,
    color TEXT NOT NULL,
    material TEXT,
    purchase_price NUMERIC(10,2) NOT NULL,
    sale_price NUMERIC(10,2) NOT NULL,
    current_stock INTEGER DEFAULT 0,
    min_stock INTEGER DEFAULT 5,
    sku TEXT UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabla de movimientos de stock
CREATE TABLE IF NOT EXISTS public.stock_movements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    carcasa_id UUID REFERENCES public.carcasas(id) ON DELETE RESTRICT,
    movement_type TEXT NOT NULL CHECK (movement_type IN ('entrada', 'venta', 'ajuste', 'devolucion', 'dañado', 'perdido')),
    quantity INTEGER NOT NULL,
    unit_price NUMERIC(10,2),
    total_price NUMERIC(10,2),
    observation TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Tabla de ventas
CREATE TABLE IF NOT EXISTS public.sales (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    carcasa_id UUID REFERENCES public.carcasas(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL,
    unit_price NUMERIC(10,2) NOT NULL,
    total_price NUMERIC(10,2) NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_profiles
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_carcasas
    BEFORE UPDATE ON public.carcasas
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Trigger para crear perfil al registrar usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, role)
    VALUES (NEW.id, NEW.email, 'vendedor');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Insertar modelos de iPhone
INSERT INTO public.iphone_models (family, model) VALUES
('iPhone 11', 'iPhone 11'),
('iPhone 11', 'iPhone 11 Pro'),
('iPhone 11', 'iPhone 11 Pro Max'),
('iPhone 12', 'iPhone 12 mini'),
('iPhone 12', 'iPhone 12'),
('iPhone 12', 'iPhone 12 Pro'),
('iPhone 12', 'iPhone 12 Pro Max'),
('iPhone 13', 'iPhone 13 mini'),
('iPhone 13', 'iPhone 13'),
('iPhone 13', 'iPhone 13 Pro'),
('iPhone 13', 'iPhone 13 Pro Max'),
('iPhone 14', 'iPhone 14'),
('iPhone 14', 'iPhone 14 Plus'),
('iPhone 14', 'iPhone 14 Pro'),
('iPhone 14', 'iPhone 14 Pro Max'),
('iPhone 15', 'iPhone 15'),
('iPhone 15', 'iPhone 15 Plus'),
('iPhone 15', 'iPhone 15 Pro'),
('iPhone 15', 'iPhone 15 Pro Max'),
('iPhone 16', 'iPhone 16'),
('iPhone 16', 'iPhone 16 Plus'),
('iPhone 16', 'iPhone 16 Pro'),
('iPhone 16', 'iPhone 16 Pro Max'),
('iPhone 16', 'iPhone 16e'),
('iPhone 17', 'iPhone 17'),
('iPhone 17', 'iPhone 17e'),
('iPhone 17', 'iPhone 17 Pro'),
('iPhone 17', 'iPhone 17 Pro Max'),
('iPhone 17', 'iPhone Air')
ON CONFLICT (model) DO NOTHING;

-- Insertar tipos de carcasa
INSERT INTO public.case_types (name) VALUES
('Transparente'),
('Silicona'),
('Antigolpes'),
('MagSafe'),
('Acrílica'),
('Estampada'),
('Ecocuero'),
('Bumper'),
('Cámara protegida'),
('Premium')
ON CONFLICT (name) DO NOTHING;

-- POLÍTICAS RLS

-- Habilitar RLS en todas las tablas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.iphone_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carcasas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

-- Políticas para profiles
CREATE POLICY "Usuarios pueden ver su propio perfil"
    ON public.profiles
    FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Administradores pueden ver todos los perfiles"
    ON public.profiles
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'administrador'
        )
    );

-- Políticas para iphone_models (lectura para todos los usuarios autenticados)
CREATE POLICY "Todos los usuarios autenticados pueden ver modelos de iPhone"
    ON public.iphone_models
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Políticas para case_types (lectura para todos los usuarios autenticados)
CREATE POLICY "Todos los usuarios autenticados pueden ver tipos de carcasa"
    ON public.case_types
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Políticas para carcasas
CREATE POLICY "Todos los usuarios autenticados pueden ver carcasas"
    ON public.carcasas
    FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Solo administradores pueden crear, editar y desactivar carcasas"
    ON public.carcasas
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'administrador'
        )
    );

-- Políticas para stock_movements
CREATE POLICY "Todos los usuarios autenticados pueden ver movimientos"
    ON public.stock_movements
    FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Todos los usuarios autenticados pueden crear movimientos"
    ON public.stock_movements
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Políticas para sales
CREATE POLICY "Todos los usuarios autenticados pueden ver ventas"
    ON public.sales
    FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Todos los usuarios autenticados pueden crear ventas"
    ON public.sales
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Stored Procedure para agregar stock
CREATE OR REPLACE FUNCTION public.add_stock(
    p_carcasa_id UUID,
    p_quantity INTEGER,
    p_unit_price NUMERIC,
    p_observation TEXT,
    p_user_id UUID
)
RETURNS VOID AS $$
DECLARE
    v_total_price NUMERIC;
BEGIN
    v_total_price := p_quantity * p_unit_price;

    UPDATE public.carcasas
    SET current_stock = current_stock + p_quantity
    WHERE id = p_carcasa_id;

    INSERT INTO public.stock_movements (carcasa_id, movement_type, quantity, unit_price, total_price, observation, user_id)
    VALUES (p_carcasa_id, 'entrada', p_quantity, p_unit_price, v_total_price, p_observation, p_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Stored Procedure para registrar venta y restar stock
CREATE OR REPLACE FUNCTION public.record_sale(
    p_carcasa_id UUID,
    p_quantity INTEGER,
    p_unit_price NUMERIC,
    p_user_id UUID
)
RETURNS VOID AS $$
DECLARE
    v_total_price NUMERIC;
    v_current_stock INTEGER;
BEGIN
    SELECT current_stock INTO v_current_stock
    FROM public.carcasas
    WHERE id = p_carcasa_id;

    IF v_current_stock < p_quantity THEN
        RAISE EXCEPTION 'Stock insuficiente';
    END IF;

    v_total_price := p_quantity * p_unit_price;

    UPDATE public.carcasas
    SET current_stock = current_stock - p_quantity
    WHERE id = p_carcasa_id;

    INSERT INTO public.sales (carcasa_id, quantity, unit_price, total_price, user_id)
    VALUES (p_carcasa_id, p_quantity, p_unit_price, v_total_price, p_user_id);

    INSERT INTO public.stock_movements (carcasa_id, movement_type, quantity, unit_price, total_price, user_id)
    VALUES (p_carcasa_id, 'venta', p_quantity, p_unit_price, v_total_price, p_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
