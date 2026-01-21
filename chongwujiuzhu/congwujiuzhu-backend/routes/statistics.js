const express = require('express');
const router = express.Router();
const pool = require('../db');

// 获取基本统计数据
router.get('/overview', async (req, res) => {
  try {
    const conn = await pool.getConnection();
    
    // 总救助信息数
    const [totalRows] = await conn.query('SELECT COUNT(*) as count FROM pets');
    
    // 待救助数
    const [needsRows] = await conn.query(
      "SELECT COUNT(*) as count FROM pets WHERE status = 'NEEDS_RESCUE'"
    );
    
    // 已救助数
    const [rescuedRows] = await conn.query(
      "SELECT COUNT(*) as count FROM pets WHERE status = 'RESCUED'"
    );
    
    // 今日新增
    const [todayRows] = await conn.query(
      "SELECT COUNT(*) as count FROM pets WHERE DATE(FROM_UNIXTIME(timestamp/1000)) = CURDATE()"
    );
    
    conn.release();
    
    res.json({
      code: 200,
      message: 'success',
      data: {
        totalReports: totalRows[0].count,
        needsRescue: needsRows[0].count,
        rescued: rescuedRows[0].count,
        todayNew: todayRows[0].count
      }
    });
  } catch (error) {
    res.status(500).json({ code: 500, message: error.message });
  }
});

// 获取趋势数据（最近 7 天）
router.get('/trends', async (req, res) => {
  try {
    const conn = await pool.getConnection();
    const [rows] = await conn.query(
      `SELECT 
        DATE(FROM_UNIXTIME(timestamp/1000)) as date,
        COUNT(*) as reports,
        SUM(CASE WHEN status = 'RESCUED' THEN 1 ELSE 0 END) as rescued
       FROM pets
       WHERE timestamp >= UNIX_TIMESTAMP(CURDATE() - INTERVAL 7 DAY) * 1000
       GROUP BY DATE(FROM_UNIXTIME(timestamp/1000))
       ORDER BY date DESC`
    );
    conn.release();
    
    res.json({ code: 200, message: 'success', data: rows });
  } catch (error) {
    res.status(500).json({ code: 500, message: error.message });
  }
});

// 获取地区分布数据
router.get('/regions', async (req, res) => {
  try {
    const conn = await pool.getConnection();
    const [rows] = await conn.query(
      `SELECT 
        SUBSTRING_INDEX(address, ',', 1) as region,
        COUNT(*) as count,
        SUM(CASE WHEN status = 'RESCUED' THEN 1 ELSE 0 END) as rescued
       FROM pets
       GROUP BY SUBSTRING_INDEX(address, ',', 1)
       ORDER BY count DESC`
    );
    conn.release();
    
    res.json({ code: 200, message: 'success', data: rows });
  } catch (error) {
    res.status(500).json({ code: 500, message: error.message });
  }
});

module.exports = router;
