-- ===========================================
-- ARCHITECTURE SÉCURISÉE PRODUCTION-GRADE
-- ===========================================

-- 1. Créer l'enum pour les rôles utilisateur
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- 2. Table des profils utilisateurs
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Table des rôles utilisateurs (séparée pour éviter escalade de privilèges)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- 4. Table des deals (user-owned)
CREATE TABLE public.deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount NUMERIC(12,2),
  stage TEXT DEFAULT 'new',
  hubspot_deal_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Table des paramètres de risque (user-owned)
CREATE TABLE public.risk_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  max_deal_amount NUMERIC(12,2) DEFAULT 100000,
  risk_tolerance TEXT DEFAULT 'medium',
  alert_threshold NUMERIC(5,2) DEFAULT 80.00,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- 6. Table des préférences agent (user-owned)
CREATE TABLE public.agent_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_email BOOLEAN DEFAULT true,
  notification_push BOOLEAN DEFAULT false,
  language TEXT DEFAULT 'fr',
  timezone TEXT DEFAULT 'Europe/Paris',
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- 7. Table des tokens HubSpot (SERVER-SIDE ONLY - service_role uniquement)
CREATE TABLE public.hubspot_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  scope TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- ===========================================
-- INDEX POUR PERFORMANCE
-- ===========================================
CREATE INDEX idx_profiles_id ON public.profiles(id);
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_deals_user_id ON public.deals(user_id);
CREATE INDEX idx_deals_hubspot_id ON public.deals(hubspot_deal_id);
CREATE INDEX idx_risk_settings_user_id ON public.risk_settings(user_id);
CREATE INDEX idx_agent_preferences_user_id ON public.agent_preferences(user_id);
CREATE INDEX idx_hubspot_tokens_user_id ON public.hubspot_tokens(user_id);

-- ===========================================
-- ACTIVER RLS SUR TOUTES LES TABLES
-- ===========================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hubspot_tokens ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- FONCTION SECURITY DEFINER POUR VÉRIFIER LES RÔLES
-- ===========================================
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- ===========================================
-- RLS POLICIES - PROFILES
-- ===========================================
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_delete_own" ON public.profiles
  FOR DELETE TO authenticated
  USING (id = auth.uid());

-- ===========================================
-- RLS POLICIES - USER_ROLES (lecture seule pour l'utilisateur)
-- ===========================================
CREATE POLICY "user_roles_select_own" ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Pas d'INSERT/UPDATE/DELETE pour les utilisateurs (admin seulement via service_role)

-- ===========================================
-- RLS POLICIES - DEALS
-- ===========================================
CREATE POLICY "deals_select_own" ON public.deals
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "deals_insert_own" ON public.deals
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "deals_update_own" ON public.deals
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "deals_delete_own" ON public.deals
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ===========================================
-- RLS POLICIES - RISK_SETTINGS
-- ===========================================
CREATE POLICY "risk_settings_select_own" ON public.risk_settings
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "risk_settings_insert_own" ON public.risk_settings
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "risk_settings_update_own" ON public.risk_settings
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "risk_settings_delete_own" ON public.risk_settings
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ===========================================
-- RLS POLICIES - AGENT_PREFERENCES
-- ===========================================
CREATE POLICY "agent_preferences_select_own" ON public.agent_preferences
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "agent_preferences_insert_own" ON public.agent_preferences
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "agent_preferences_update_own" ON public.agent_preferences
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "agent_preferences_delete_own" ON public.agent_preferences
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ===========================================
-- RLS POLICIES - HUBSPOT_TOKENS (AUCUN accès client - service_role uniquement)
-- ===========================================
-- PAS DE POLICIES = accès interdit au client
-- Seul service_role peut lire/écrire (utilisé dans Edge Functions)

-- ===========================================
-- TRIGGERS POUR MISE À JOUR AUTOMATIQUE
-- ===========================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_deals_updated_at
  BEFORE UPDATE ON public.deals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_risk_settings_updated_at
  BEFORE UPDATE ON public.risk_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_agent_preferences_updated_at
  BEFORE UPDATE ON public.agent_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_hubspot_tokens_updated_at
  BEFORE UPDATE ON public.hubspot_tokens
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===========================================
-- TRIGGER POUR CRÉER PROFIL À L'INSCRIPTION
-- ===========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '')
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();