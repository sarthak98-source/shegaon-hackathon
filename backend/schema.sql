-- ================================================================
-- VivMart — Complete MySQL Database Schema
-- Run:  mysql -u root -p < schema.sql
-- ================================================================

CREATE DATABASE IF NOT EXISTS vivmart
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE vivmart;

-- ── Users (buyer | seller | admin) ───────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id           INT          AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(100) NOT NULL,
  email        VARCHAR(150) NOT NULL UNIQUE,
  password     VARCHAR(255) NOT NULL,
  role         ENUM('buyer','seller','admin') NOT NULL DEFAULT 'buyer',
  phone        VARCHAR(20),
  avatar_url   VARCHAR(500),
  status       ENUM('active','pending','suspended') NOT NULL DEFAULT 'active',
  last_login   DATETIME,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email  (email),
  INDEX idx_role   (role),
  INDEX idx_status (status)
);

-- ── Products ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id             INT           AUTO_INCREMENT PRIMARY KEY,
  seller_id      INT           NOT NULL,
  name           VARCHAR(200)  NOT NULL,
  category       VARCHAR(50)   NOT NULL,
  ar_mode        ENUM('body','face','room','3d','shoes') DEFAULT '3d',
  price          DECIMAL(12,2) NOT NULL,
  original_price DECIMAL(12,2),
  description    TEXT,
  image_url      VARCHAR(500),
  model_url      VARCHAR(500),
  badge          VARCHAR(50),
  rating         DECIMAL(3,1)  DEFAULT 0.0,
  review_count   INT           DEFAULT 0,
  colors         JSON,
  sizes          JSON,
  featured       TINYINT(1)    DEFAULT 0,
  stock          INT           DEFAULT 100,
  active         TINYINT(1)    DEFAULT 1,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_category  (category),
  INDEX idx_seller    (seller_id),
  INDEX idx_ar_mode   (ar_mode),
  INDEX idx_featured  (featured),
  FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ── Orders ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id             INT           AUTO_INCREMENT PRIMARY KEY,
  buyer_id       INT           NOT NULL,
  items          JSON          NOT NULL,
  address        JSON          NOT NULL,
  payment_method VARCHAR(50)   DEFAULT 'upi',
  subtotal       DECIMAL(12,2) DEFAULT 0,
  shipping       DECIMAL(10,2) DEFAULT 0,
  tax            DECIMAL(10,2) DEFAULT 0,
  total          DECIMAL(12,2) NOT NULL,
  status         ENUM('pending','confirmed','shipped','delivered','cancelled') DEFAULT 'pending',
  notes          TEXT,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_buyer  (buyer_id),
  INDEX idx_status (status),
  FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ── Live Sessions ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS live_sessions (
  id          INT          AUTO_INCREMENT PRIMARY KEY,
  seller_id   INT          NOT NULL,
  title       VARCHAR(200) NOT NULL,
  channel     VARCHAR(100) NOT NULL UNIQUE,
  product_ids JSON,
  status      ENUM('active','ended','scheduled') DEFAULT 'active',
  viewers     INT          DEFAULT 0,
  started_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ended_at    DATETIME,
  INDEX idx_seller (seller_id),
  INDEX idx_status (status),
  FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ── Live Chat Messages ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_messages (
  id         INT          AUTO_INCREMENT PRIMARY KEY,
  session_id INT          NOT NULL,
  user_id    INT,
  user_name  VARCHAR(100) NOT NULL,
  role       ENUM('buyer','seller','system') DEFAULT 'buyer',
  message    TEXT         NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_session (session_id),
  FOREIGN KEY (session_id) REFERENCES live_sessions(id) ON DELETE CASCADE
);

-- ── Reviews ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reviews (
  id         INT          AUTO_INCREMENT PRIMARY KEY,
  product_id INT          NOT NULL,
  user_id    INT          NOT NULL,
  rating     TINYINT      NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment    TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_review (product_id, user_id),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE
);

-- ── Wishlist ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wishlist (
  id         INT       AUTO_INCREMENT PRIMARY KEY,
  user_id    INT       NOT NULL,
  product_id INT       NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_wish (user_id, product_id),
  FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- ================================================================
-- Seed Data
-- ================================================================

-- Default admin + demo accounts (password: demo1234 for all)
-- bcrypt hash of 'demo1234' with 12 rounds:
INSERT IGNORE INTO users (name, email, password, role, status) VALUES
('Admin User',   'admin@vivmart.com',  '$2a$12$LiGRNfMaFHX1I5z.JyRK.OKC4lHzl1UdG3F2M0Hs6VpXQ0VWGKN22', 'admin',  'active'),
('Demo Seller',  'seller@vivmart.com', '$2a$12$LiGRNfMaFHX1I5z.JyRK.OKC4lHzl1UdG3F2M0Hs6VpXQ0VWGKN22', 'seller', 'active'),
('Demo Buyer',   'buyer@vivmart.com',  '$2a$12$LiGRNfMaFHX1I5z.JyRK.OKC4lHzl1UdG3F2M0Hs6VpXQ0VWGKN22', 'buyer',  'active');

-- Seed products (seller_id=2 = Demo Seller)
INSERT IGNORE INTO products (seller_id, name, category, ar_mode, price, original_price, description, image_url, model_url, badge, rating, review_count, colors, sizes, featured) VALUES
(2,'Luxe Silk Blazer',       'clothing',   'body', 12999, 18999, 'Premium Italian silk blazer with hand-stitched lapels.', 'https://images.unsplash.com/photo-1594938298603-c8148c4b4571?w=600','',       'AR Try-On',  4.8,124,'["#1a1a1a","#8B7355","#2c4a7c"]','["S","M","L","XL"]',          1),
(2,'Diamond Halo Ring',       'jewelry',    'face', 45999, 65000, 'Lab-grown 2ct diamond halo ring set in 18k white gold.', 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600','',       'Best Seller',4.9,89, '["#C0C0C0","#FFD700"]',        '["5","6","7","8"]',            1),
(2,'Aviator Pro Sunglasses',  'glasses',    'face',  5999,  8999, 'Polarized UV400 lenses with titanium frame.',            'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600','',       'AR Try-On',  4.7,203,'["#1a1a1a","#FFD700"]',        '["One Size"]',                 1),
(2,'Velvet Bucket Hat',       'hats',       'face',  2499,  3999, 'Premium crushed velvet bucket hat.',                     'https://images.unsplash.com/photo-1514327605112-b887c0e61c0a?w=600','',       'New',        4.5,67, '["#1a1a1a","#8B0000"]',        '["S/M","L/XL"]',               0),
(2,'Moderno Sofa',            'furniture',  'room', 89999,129999, 'Contemporary 3-seater sofa in premium Italian leather.',  'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600','',       'AR Place',   4.6,45, '["#E8DCC8","#1a1a1a"]',        '["2-Seat","3-Seat"]',          1),
(2,'iPhone 15 Pro Max',       'electronics','3d',  134900,149900, 'Apple iPhone 15 Pro Max with A17 Pro chip.',             'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600','',       '3D View',    4.9,512,'["#E5CDBB","#1a1a1a"]',        '["256GB","512GB"]',            1),
(2,'Embroidered Maxi Dress',  'clothing',   'body',  7499, 12000, 'Hand-embroidered maxi dress in breathable cotton blend.', 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=600','',       'AR Try-On',  4.7,98, '["#F5F0E8","#8B0000"]',        '["XS","S","M","L","XL"]',      0),
(2,'Marble Table Lamp',       'home-decor', 'room',  8999, 14999, 'Natural white marble base with a hand-blown glass shade.','https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600','',       'AR Place',   4.4,33, '["#F5F5F5","#1a1a1a"]',        '["Small","Large"]',            0),
(2,'MacBook Pro 14"',         'electronics','3d',  199900,219900, 'Apple M3 Pro chip, 18GB unified memory.',                'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600','',       '3D View',    4.9,278,'["#C0C0C0","#1a1a1a"]',        '["18GB","36GB"]',              0),
(2,'Pearl Drop Earrings',     'jewelry',    'face',  3999,  6500, 'Freshwater pearl drops with 14k gold vermeil setting.',  'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600','',       'AR Try-On',  4.6,156,'["#F5F5F5","#FFD700"]',        '["One Size"]',                 0),
(2,'Leather Oxford Shoes',    'shoes',      'shoes',14999, 22000, 'Hand-crafted full-grain leather oxford shoes.',           'https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=600','',       'AR Try-On',  4.8,87, '["#2c1810","#1a1a1a"]',        '["7","8","9","10","11"]',      0),
(2,'Walnut Dining Chair',     'furniture',  'room', 24999, 35000, 'Solid American walnut with hand-upholstered seat.',       'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=600','',       'AR Place',   4.5,29, '["#6B4226","#1a1a1a"]',        '["Single","Set of 2"]',        0);
