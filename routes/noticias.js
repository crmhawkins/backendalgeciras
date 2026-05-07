'use strict';

const { Router } = require('express');
const { Op } = require('sequelize');
const Noticia = require('../models/noticia');

const router = Router();

// GET /api/noticias — lista paginada, filtro opcional por categoria y destacado
router.get('/', async (req, res) => {
    try {
        const { categoria, destacado, page = 1, limit = 20 } = req.query;
        const where = { activo: true };
        if (categoria) where.categoria = categoria;
        if (destacado === 'true') where.destacado = true;

        const offset = (parseInt(page) - 1) * parseInt(limit);
        const { count, rows } = await Noticia.findAndCountAll({
            where,
            order: [['fecha', 'DESC'], ['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset,
        });

        res.json({
            total: count,
            pagina: parseInt(page),
            totalPaginas: Math.ceil(count / parseInt(limit)),
            noticias: rows,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Error al obtener noticias' });
    }
});

// GET /api/noticias/destacadas — solo destacadas (shortcut para home)
router.get('/destacadas', async (req, res) => {
    try {
        const noticias = await Noticia.findAll({
            where: { activo: true, destacado: true },
            order: [['fecha', 'DESC']],
            limit: 10,
        });
        res.json({ noticias });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Error al obtener noticias destacadas' });
    }
});

// GET /api/noticias/:slug
router.get('/:slug', async (req, res) => {
    try {
        const noticia = await Noticia.findOne({
            where: { slug: req.params.slug, activo: true },
        });
        if (!noticia) return res.status(404).json({ msg: 'Noticia no encontrada' });

        // Noticias relacionadas: misma categoría, excluye la actual
        const relacionadas = await Noticia.findAll({
            where: {
                activo: true,
                categoria: noticia.categoria,
                id: { [Op.ne]: noticia.id },
            },
            order: [['fecha', 'DESC']],
            limit: 3,
            attributes: ['id', 'titulo', 'slug', 'imagen', 'fecha', 'categoria'],
        });

        res.json({ noticia, relacionadas });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Error al obtener noticia' });
    }
});

module.exports = router;
