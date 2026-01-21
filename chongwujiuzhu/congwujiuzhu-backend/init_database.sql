-- 宠物救助小程序数据库初始化脚本
-- 使用方法: mysql -u root -p < init_database.sql

-- 创建数据库
CREATE DATABASE IF NOT EXISTS congwujiuzhu DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE congwujiuzhu;

-- 1. 用户表
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    open_id VARCHAR(255) NOT NULL UNIQUE,
    display_id VARCHAR(20) UNIQUE,
    nickname VARCHAR(255),
    avatar_url VARCHAR(1024),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. 宠物救助信息表
CREATE TABLE IF NOT EXISTS pets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    description TEXT,
    location_lat DECIMAL(10, 7),
    location_lng DECIMAL(10, 7),
    address VARCHAR(500),
    status ENUM('NEEDS_RESCUE', 'RESCUED') DEFAULT 'NEEDS_RESCUE',
    audit_status ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING',
    images JSON,
    videos JSON,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reporter_name VARCHAR(255),
    reporter_avatar VARCHAR(1024),
    reporter_openid VARCHAR(255),
    ai_analysis TEXT,
    rescue_details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. 宠物日常动态表
CREATE TABLE IF NOT EXISTS pet_dailies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pet_id INT NOT NULL,
    author_name VARCHAR(255),
    author_avatar VARCHAR(1024),
    content TEXT,
    images JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. 日常动态评论表
CREATE TABLE IF NOT EXISTS daily_comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    daily_id INT NOT NULL,
    author_name VARCHAR(255),
    author_avatar VARCHAR(1024),
    content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (daily_id) REFERENCES pet_dailies(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. 救助记录表
CREATE TABLE IF NOT EXISTS rescue_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pet_id INT NOT NULL,
    rescuer_name VARCHAR(255),
    rescuer_avatar VARCHAR(1024),
    rescuer_openid VARCHAR(255),
    rescue_method VARCHAR(255),
    rescue_location VARCHAR(500),
    notes TEXT,
    photos JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. 社区帖子表
CREATE TABLE IF NOT EXISTS community_posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pet_id INT NULL,
    content TEXT,
    images JSON,
    videos JSON,
    author_name VARCHAR(255),
    author_avatar VARCHAR(1024),
    author_openid VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. 社区评论表
CREATE TABLE IF NOT EXISTS community_comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    post_id INT NOT NULL,
    parent_id INT NULL,
    content TEXT,
    author_name VARCHAR(255),
    author_avatar VARCHAR(1024),
    author_openid VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. 管理员表
CREATE TABLE IF NOT EXISTS admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. 系统设置表
CREATE TABLE IF NOT EXISTS settings (
    setting_key VARCHAR(50) PRIMARY KEY,
    setting_value TEXT,
    description VARCHAR(255)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. 审核记录表
CREATE TABLE IF NOT EXISTS audits (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pet_id INT NOT NULL,
    reviewer_name VARCHAR(255),
    status ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL,
    reason TEXT,
    comment TEXT,
    admin_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. 用户通知表
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_openid VARCHAR(255) NOT NULL,
    type VARCHAR(50),
    title VARCHAR(255),
    content TEXT,
    related_id INT,
    is_read TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 插入默认管理员账号 (admin / admin123)
INSERT IGNORE INTO admins (username, password) VALUES ('admin', 'admin123');

-- 插入默认设置
INSERT IGNORE INTO settings (setting_key, setting_value, description) VALUES 
    ('audit_required', 'true', '是否开启发帖审核 (true/false)'),
    ('share_title_template', '【$状态】$地点 $描述', '分享标题模板');

-- 插入测试数据（可选）
INSERT INTO pets (description, location_lat, location_lng, address, status, audit_status, images, reporter_name, reporter_openid) VALUES
('发现一只流浪小橘猫，看起来很饿', 39.9042, 116.4074, '北京市东城区天安门广场', 'NEEDS_RESCUE', 'APPROVED', '[]', '爱心志愿者', 'test_openid_1'),
('已救助的小狗，正在寻找领养', 39.9142, 116.4174, '北京市东城区王府井', 'RESCUED', 'APPROVED', '[]', '动物保护协会', 'test_openid_2');

SELECT '数据库初始化完成!' as message;
