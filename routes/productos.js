const { Router } = require('express');
const { validarJWT } = require('../middlewares/validar-jwt');
const { esAdmin } = require('../middlewares/es-admin');
const Producto = require('../models/producto');

const router = Router();

router.get('/', async (req, res) => {
    try {
        const { categoria } = req.query;
        const where = { activo: true };
        if (categoria) where.categoria = categoria;

        const productos = await Producto.findAll({
            where,
            order: [['destacado', 'DESC'], ['orden', 'ASC'], ['createdAt', 'DESC']]
        });
        res.json({ productos });
    } catch (error) {
        console.error('[GET /productos]', error.message);
        res.status(500).json({ msg: 'Error al obtener productos' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const producto = await Producto.findOne({
            where: { id: req.params.id, activo: true }
        });
        if (!producto) return res.status(404).json({ msg: 'Producto no encontrado' });
        res.json({ producto });
    } catch (error) {
        console.error('[GET /productos/:id]', error.message);
        res.status(500).json({ msg: 'Error al obtener producto' });
    }
});

router.post('/', validarJWT, esAdmin, async (req, res) => {
    try {
        const { nombre, descripcion, precio, precioAnterior, imagen, imagenes, categoria, tallas, temporada, destacado, orden } = req.body;
        const producto = await Producto.create({ nombre, descripcion, precio, precioAnterior, imagen, imagenes, categoria, tallas, temporada, destacado, orden });
        res.status(201).json({ msg: 'Producto creado', producto });
    } catch (error) {
        console.error('[POST /productos]', error.message);
        res.status(500).json({ msg: 'Error al crear producto' });
    }
});

router.put('/:id', validarJWT, esAdmin, async (req, res) => {
    try {
        const producto = await Producto.findByPk(req.params.id);
        if (!producto) return res.status(404).json({ msg: 'Producto no encontrado' });
        await producto.update(req.body);
        res.json({ msg: 'Producto actualizado', producto });
    } catch (error) {
        console.error('[PUT /productos/:id]', error.message);
        res.status(500).json({ msg: 'Error al actualizar producto' });
    }
});

router.delete('/:id', validarJWT, esAdmin, async (req, res) => {
    try {
        const producto = await Producto.findByPk(req.params.id);
        if (!producto) return res.status(404).json({ msg: 'Producto no encontrado' });
        await producto.update({ activo: false });
        res.json({ msg: 'Producto desactivado' });
    } catch (error) {
        console.error('[DELETE /productos/:id]', error.message);
        res.status(500).json({ msg: 'Error al desactivar producto' });
    }
});

module.exports = router;
