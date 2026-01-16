-- ============================================
-- DupeZOFRI Database Schema v3
-- MariaDB / MySQL
-- ============================================

-- Crear base de datos
CREATE DATABASE IF NOT EXISTS dupezofri 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE dupezofri;

-- ============================================
-- TABLAS
-- ============================================

-- 1. Usuarios
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    photo_url VARCHAR(500),
    is_moderator BOOLEAN DEFAULT FALSE,
    auth_provider ENUM('google', 'email', 'github') DEFAULT 'google',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_moderator (is_moderator)
) ENGINE=InnoDB;

-- 2. Grupos
CREATE TABLE groups (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    owner_id VARCHAR(36) NOT NULL,
    invite_code VARCHAR(20) NOT NULL UNIQUE,
    public_read BOOLEAN DEFAULT FALSE,
    public_slug VARCHAR(50) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_invite_code (invite_code),
    INDEX idx_public_slug (public_slug),
    INDEX idx_owner (owner_id)
) ENGINE=InnoDB;

-- 3. Miembros de grupo
CREATE TABLE group_members (
    id VARCHAR(36) PRIMARY KEY,
    group_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    role ENUM('owner', 'editor', 'member', 'viewer') NOT NULL DEFAULT 'member',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uk_membership (group_id, user_id),
    INDEX idx_group (group_id),
    INDEX idx_user (user_id),
    INDEX idx_role (role)
) ENGINE=InnoDB;

-- 4. Perfumes (Catálogo Global)
CREATE TABLE perfumes (
    id VARCHAR(36) PRIMARY KEY,
    tipo ENUM('original', 'dupe') NOT NULL,
    parent_id VARCHAR(36) NULL,
    nombre VARCHAR(200) NOT NULL,
    marca VARCHAR(100),
    ml INT,
    imagen_principal VARCHAR(500),
    url_fragrantica VARCHAR(500),
    slug VARCHAR(250) NOT NULL UNIQUE,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    -- Cache de promedios globales
    avg_parecido DECIMAL(4,2) DEFAULT 0,
    avg_calidad DECIMAL(4,2) DEFAULT 0,
    avg_duracion DECIMAL(4,2) DEFAULT 0,
    avg_proyeccion DECIMAL(4,2) DEFAULT 0,
    votes_count INT DEFAULT 0,
    -- Auditoría
    created_by VARCHAR(36) NOT NULL,
    approved_by VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP NULL,
    
    FOREIGN KEY (parent_id) REFERENCES perfumes(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (approved_by) REFERENCES users(id),
    INDEX idx_tipo (tipo),
    INDEX idx_parent (parent_id),
    INDEX idx_status (status),
    INDEX idx_marca (marca),
    INDEX idx_created_by (created_by),
    FULLTEXT INDEX ft_search (nombre, marca)
) ENGINE=InnoDB;

-- 5. Tags de perfumes
CREATE TABLE perfume_tags (
    id VARCHAR(36) PRIMARY KEY,
    perfume_id VARCHAR(36) NOT NULL,
    tag VARCHAR(50) NOT NULL,
    
    FOREIGN KEY (perfume_id) REFERENCES perfumes(id) ON DELETE CASCADE,
    UNIQUE KEY uk_perfume_tag (perfume_id, tag),
    INDEX idx_tag (tag)
) ENGINE=InnoDB;

-- 6. URLs de perfumes
CREATE TABLE perfume_urls (
    id VARCHAR(36) PRIMARY KEY,
    perfume_id VARCHAR(36) NOT NULL,
    tipo ENUM('fragrantica', 'vinted', 'vinted_chile', 'marca', 'aliexpress', 'otro') NOT NULL,
    url VARCHAR(500) NOT NULL,
    
    FOREIGN KEY (perfume_id) REFERENCES perfumes(id) ON DELETE CASCADE,
    INDEX idx_perfume (perfume_id)
) ENGINE=InnoDB;

-- 7. Propuestas de perfumes
CREATE TABLE perfume_proposals (
    id VARCHAR(36) PRIMARY KEY,
    perfume_id VARCHAR(36) NULL,
    action ENUM('create', 'edit', 'delete') NOT NULL,
    data JSON NOT NULL,
    reason TEXT,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    proposed_by VARCHAR(36) NOT NULL,
    reviewed_by VARCHAR(36) NULL,
    proposed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP NULL,
    review_notes TEXT,
    
    FOREIGN KEY (perfume_id) REFERENCES perfumes(id) ON DELETE CASCADE,
    FOREIGN KEY (proposed_by) REFERENCES users(id),
    FOREIGN KEY (reviewed_by) REFERENCES users(id),
    INDEX idx_status (status),
    INDEX idx_proposed_by (proposed_by),
    INDEX idx_action (action)
) ENGINE=InnoDB;

-- 8. Tiendas del grupo
CREATE TABLE group_stores (
    id VARCHAR(36) PRIMARY KEY,
    group_id VARCHAR(36) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    tipo ENUM('fisica', 'online') NOT NULL DEFAULT 'fisica',
    direccion VARCHAR(255),
    url VARCHAR(500),
    created_by VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id),
    UNIQUE KEY uk_group_store (group_id, nombre),
    INDEX idx_group (group_id),
    INDEX idx_tipo (tipo)
) ENGINE=InnoDB;

-- 9. Precios actuales por grupo
CREATE TABLE group_perfume_prices (
    id VARCHAR(36) PRIMARY KEY,
    group_id VARCHAR(36) NOT NULL,
    perfume_id VARCHAR(36) NOT NULL,
    store_id VARCHAR(36) NOT NULL,
    precio DECIMAL(10,2) NOT NULL,
    agotado BOOLEAN DEFAULT FALSE,
    nota VARCHAR(255),
    updated_by VARCHAR(36) NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
    FOREIGN KEY (perfume_id) REFERENCES perfumes(id) ON DELETE CASCADE,
    FOREIGN KEY (store_id) REFERENCES group_stores(id) ON DELETE CASCADE,
    FOREIGN KEY (updated_by) REFERENCES users(id),
    UNIQUE KEY uk_price (group_id, perfume_id, store_id),
    INDEX idx_perfume (perfume_id),
    INDEX idx_agotado (agotado)
) ENGINE=InnoDB;

-- 10. Historial de precios
CREATE TABLE price_history (
    id VARCHAR(36) PRIMARY KEY,
    group_id VARCHAR(36) NOT NULL,
    perfume_id VARCHAR(36) NOT NULL,
    store_id VARCHAR(36) NOT NULL,
    precio DECIMAL(10,2) NOT NULL,
    recorded_by VARCHAR(36) NOT NULL,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
    FOREIGN KEY (perfume_id) REFERENCES perfumes(id) ON DELETE CASCADE,
    FOREIGN KEY (store_id) REFERENCES group_stores(id) ON DELETE CASCADE,
    FOREIGN KEY (recorded_by) REFERENCES users(id),
    INDEX idx_perfume_store (perfume_id, store_id),
    INDEX idx_recorded_at (recorded_at)
) ENGINE=InnoDB;

-- 11. Votos
CREATE TABLE votes (
    id VARCHAR(36) PRIMARY KEY,
    perfume_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    scope ENUM('global', 'group') NOT NULL,
    group_id VARCHAR(36) NULL,
    -- Campos de votación (1-10)
    calidad TINYINT UNSIGNED CHECK (calidad BETWEEN 1 AND 10),
    proyeccion TINYINT UNSIGNED CHECK (proyeccion BETWEEN 1 AND 10),
    duracion TINYINT UNSIGNED CHECK (duracion BETWEEN 1 AND 10),
    parecido TINYINT UNSIGNED CHECK (parecido BETWEEN 1 AND 10),
    comentario TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (perfume_id) REFERENCES perfumes(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
    UNIQUE KEY uk_vote (perfume_id, user_id, scope, group_id),
    INDEX idx_perfume (perfume_id),
    INDEX idx_user (user_id),
    INDEX idx_group (group_id),
    INDEX idx_scope (scope)
) ENGINE=InnoDB;

-- 12. Expediciones
CREATE TABLE expeditions (
    id VARCHAR(36) PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    fecha DATE NOT NULL,
    visibility ENUM('personal', 'group') NOT NULL DEFAULT 'personal',
    group_id VARCHAR(36) NULL,
    owner_id VARCHAR(36) NOT NULL,
    estado ENUM('planificando', 'activa', 'cerrada') NOT NULL DEFAULT 'planificando',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP NULL,
    
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_owner (owner_id),
    INDEX idx_group (group_id),
    INDEX idx_estado (estado),
    INDEX idx_fecha (fecha)
) ENGINE=InnoDB;

-- 13. Miembros de expedición
CREATE TABLE expedition_members (
    id VARCHAR(36) PRIMARY KEY,
    expedition_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    role ENUM('owner', 'editor', 'viewer') NOT NULL DEFAULT 'viewer',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (expedition_id) REFERENCES expeditions(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uk_member (expedition_id, user_id),
    INDEX idx_expedition (expedition_id),
    INDEX idx_user (user_id)
) ENGINE=InnoDB;

-- 14. Items de expedición
CREATE TABLE expedition_items (
    id VARCHAR(36) PRIMARY KEY,
    expedition_id VARCHAR(36) NOT NULL,
    perfume_id VARCHAR(36) NULL,
    nombre_manual VARCHAR(200),
    status ENUM('pendiente', 'probado', 'no_encontrado', 'comprado', 'descartado') NOT NULL DEFAULT 'pendiente',
    added_by VARCHAR(36) NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (expedition_id) REFERENCES expeditions(id) ON DELETE CASCADE,
    FOREIGN KEY (perfume_id) REFERENCES perfumes(id) ON DELETE SET NULL,
    FOREIGN KEY (added_by) REFERENCES users(id),
    INDEX idx_expedition (expedition_id),
    INDEX idx_perfume (perfume_id),
    INDEX idx_status (status)
) ENGINE=InnoDB;

-- 15. Notas de items de expedición
CREATE TABLE expedition_item_notes (
    id VARCHAR(36) PRIMARY KEY,
    item_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    nota TEXT NOT NULL,
    rating TINYINT UNSIGNED CHECK (rating BETWEEN 1 AND 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (item_id) REFERENCES expedition_items(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_item (item_id),
    INDEX idx_user (user_id)
) ENGINE=InnoDB;

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger: Guardar historial al actualizar precio
DELIMITER //
CREATE TRIGGER trg_price_history_insert
AFTER INSERT ON group_perfume_prices
FOR EACH ROW
BEGIN
    INSERT INTO price_history (id, group_id, perfume_id, store_id, precio, recorded_by, recorded_at)
    VALUES (UUID(), NEW.group_id, NEW.perfume_id, NEW.store_id, NEW.precio, NEW.updated_by, NOW());
END //

CREATE TRIGGER trg_price_history_update
AFTER UPDATE ON group_perfume_prices
FOR EACH ROW
BEGIN
    IF OLD.precio != NEW.precio THEN
        INSERT INTO price_history (id, group_id, perfume_id, store_id, precio, recorded_by, recorded_at)
        VALUES (UUID(), NEW.group_id, NEW.perfume_id, NEW.store_id, NEW.precio, NEW.updated_by, NOW());
    END IF;
END //
DELIMITER ;

-- Trigger: Actualizar promedios globales al votar
DELIMITER //
CREATE TRIGGER trg_vote_insert
AFTER INSERT ON votes
FOR EACH ROW
BEGIN
    IF NEW.scope = 'global' THEN
        UPDATE perfumes SET
            avg_parecido = COALESCE((SELECT AVG(parecido) FROM votes WHERE perfume_id = NEW.perfume_id AND scope = 'global' AND parecido IS NOT NULL), 0),
            avg_calidad = COALESCE((SELECT AVG(calidad) FROM votes WHERE perfume_id = NEW.perfume_id AND scope = 'global' AND calidad IS NOT NULL), 0),
            avg_duracion = COALESCE((SELECT AVG(duracion) FROM votes WHERE perfume_id = NEW.perfume_id AND scope = 'global' AND duracion IS NOT NULL), 0),
            avg_proyeccion = COALESCE((SELECT AVG(proyeccion) FROM votes WHERE perfume_id = NEW.perfume_id AND scope = 'global' AND proyeccion IS NOT NULL), 0),
            votes_count = (SELECT COUNT(*) FROM votes WHERE perfume_id = NEW.perfume_id AND scope = 'global')
        WHERE id = NEW.perfume_id;
    END IF;
END //

CREATE TRIGGER trg_vote_update
AFTER UPDATE ON votes
FOR EACH ROW
BEGIN
    IF NEW.scope = 'global' THEN
        UPDATE perfumes SET
            avg_parecido = COALESCE((SELECT AVG(parecido) FROM votes WHERE perfume_id = NEW.perfume_id AND scope = 'global' AND parecido IS NOT NULL), 0),
            avg_calidad = COALESCE((SELECT AVG(calidad) FROM votes WHERE perfume_id = NEW.perfume_id AND scope = 'global' AND calidad IS NOT NULL), 0),
            avg_duracion = COALESCE((SELECT AVG(duracion) FROM votes WHERE perfume_id = NEW.perfume_id AND scope = 'global' AND duracion IS NOT NULL), 0),
            avg_proyeccion = COALESCE((SELECT AVG(proyeccion) FROM votes WHERE perfume_id = NEW.perfume_id AND scope = 'global' AND proyeccion IS NOT NULL), 0),
            votes_count = (SELECT COUNT(*) FROM votes WHERE perfume_id = NEW.perfume_id AND scope = 'global')
        WHERE id = NEW.perfume_id;
    END IF;
END //

CREATE TRIGGER trg_vote_delete
AFTER DELETE ON votes
FOR EACH ROW
BEGIN
    IF OLD.scope = 'global' THEN
        UPDATE perfumes SET
            avg_parecido = COALESCE((SELECT AVG(parecido) FROM votes WHERE perfume_id = OLD.perfume_id AND scope = 'global' AND parecido IS NOT NULL), 0),
            avg_calidad = COALESCE((SELECT AVG(calidad) FROM votes WHERE perfume_id = OLD.perfume_id AND scope = 'global' AND calidad IS NOT NULL), 0),
            avg_duracion = COALESCE((SELECT AVG(duracion) FROM votes WHERE perfume_id = OLD.perfume_id AND scope = 'global' AND duracion IS NOT NULL), 0),
            avg_proyeccion = COALESCE((SELECT AVG(proyeccion) FROM votes WHERE perfume_id = OLD.perfume_id AND scope = 'global' AND proyeccion IS NOT NULL), 0),
            votes_count = (SELECT COUNT(*) FROM votes WHERE perfume_id = OLD.perfume_id AND scope = 'global')
        WHERE id = OLD.perfume_id;
    END IF;
END //
DELIMITER ;

-- ============================================
-- VISTAS
-- ============================================

-- Vista: Catálogo de perfumes aprobados
CREATE VIEW v_perfumes_catalog AS
SELECT 
    p.id,
    p.tipo,
    p.nombre,
    p.marca,
    p.ml,
    p.imagen_principal,
    p.slug,
    p.avg_parecido,
    p.avg_calidad,
    p.avg_duracion,
    p.avg_proyeccion,
    p.votes_count,
    p.created_at,
    parent.id AS parent_id,
    parent.nombre AS parent_nombre,
    parent.marca AS parent_marca,
    u.display_name AS created_by_name,
    u.photo_url AS created_by_photo,
    (SELECT COUNT(*) FROM perfumes d WHERE d.parent_id = p.id AND d.status = 'approved') AS dupes_count
FROM perfumes p
LEFT JOIN perfumes parent ON p.parent_id = parent.id
JOIN users u ON p.created_by = u.id
WHERE p.status = 'approved';

-- Vista: Propuestas pendientes (para moderadores)
CREATE VIEW v_pending_proposals AS
SELECT 
    pp.id,
    pp.action,
    pp.data,
    pp.reason,
    pp.proposed_at,
    p.nombre AS perfume_nombre,
    u.display_name AS proposed_by_name,
    u.email AS proposed_by_email
FROM perfume_proposals pp
LEFT JOIN perfumes p ON pp.perfume_id = p.id
JOIN users u ON pp.proposed_by = u.id
WHERE pp.status = 'pending'
ORDER BY pp.proposed_at ASC;

-- Vista: Votos por grupo con promedios
CREATE VIEW v_group_votes_summary AS
SELECT 
    v.group_id,
    v.perfume_id,
    p.nombre,
    p.marca,
    p.tipo,
    ROUND(AVG(v.parecido), 2) AS avg_parecido,
    ROUND(AVG(v.calidad), 2) AS avg_calidad,
    ROUND(AVG(v.duracion), 2) AS avg_duracion,
    ROUND(AVG(v.proyeccion), 2) AS avg_proyeccion,
    COUNT(*) AS votes_count
FROM votes v
JOIN perfumes p ON v.perfume_id = p.id
WHERE v.scope = 'group' AND v.group_id IS NOT NULL
GROUP BY v.group_id, v.perfume_id;

-- Vista: Expediciones con estadísticas
CREATE VIEW v_expeditions_summary AS
SELECT 
    e.id,
    e.nombre,
    e.fecha,
    e.visibility,
    e.estado,
    e.owner_id,
    u.display_name AS owner_name,
    g.name AS group_name,
    (SELECT COUNT(*) FROM expedition_items WHERE expedition_id = e.id) AS items_count,
    (SELECT COUNT(*) FROM expedition_items WHERE expedition_id = e.id AND status = 'comprado') AS items_bought,
    (SELECT COUNT(*) FROM expedition_members WHERE expedition_id = e.id) AS members_count
FROM expeditions e
JOIN users u ON e.owner_id = u.id
LEFT JOIN groups g ON e.group_id = g.id;

-- Vista: Historial de precios de un perfume
CREATE VIEW v_price_trends AS
SELECT 
    ph.perfume_id,
    p.nombre AS perfume_nombre,
    gs.nombre AS store_nombre,
    g.name AS group_name,
    ph.precio,
    ph.recorded_at,
    u.display_name AS recorded_by_name
FROM price_history ph
JOIN perfumes p ON ph.perfume_id = p.id
JOIN group_stores gs ON ph.store_id = gs.id
JOIN groups g ON ph.group_id = g.id
JOIN users u ON ph.recorded_by = u.id
ORDER BY ph.perfume_id, ph.recorded_at DESC;

-- ============================================
-- DATOS INICIALES (Opcional)
-- ============================================

-- Usuario sistema/admin
-- INSERT INTO users (id, email, display_name, is_moderator) 
-- VALUES (UUID(), 'admin@dupezofri.com', 'Administrador', TRUE);

-- ============================================
-- FIN DEL SCRIPT
-- ============================================
