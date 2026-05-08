const { response } = require('express');
const { Op } = require('sequelize');
const CodigoDescuento = require('../models/CodigoDescuento');

/**
 * POST /api/pagos/aplicar-codigo
 * Body: { codigo, tipo: 'abono'|'entrada', monto }
 */
const aplicarCodigo = async (req, res = response) => {
    try {
        const { codigo, tipo, monto } = req.body;

        if (!codigo || !tipo || monto == null) {
            return res.status(400).json({ msg: 'codigo, tipo y monto son obligatorios' });
        }

        if (!['abono', 'entrada'].includes(tipo)) {
            return res.status(400).json({ msg: 'tipo debe ser "abono" o "entrada"' });
        }

        const montoNum = Number(monto);
        if (isNaN(montoNum) || montoNum <= 0) {
            return res.status(400).json({ msg: 'monto debe ser un número positivo' });
        }

        const codigoObj = await CodigoDescuento.findOne({
            where: { codigo: codigo.toUpperCase().trim() }
        });

        if (!codigoObj) {
            return res.status(404).json({ valido: false, msg: 'Código de descuento no encontrado' });
        }

        if (!codigoObj.activo) {
            return res.status(400).json({ valido: false, msg: 'Código de descuento inactivo' });
        }

        if (codigoObj.fechaFin && new Date() > new Date(codigoObj.fechaFin)) {
            return res.status(400).json({ valido: false, msg: 'Código de descuento expirado' });
        }

        if (codigoObj.usosMax !== null && codigoObj.usosActuales >= codigoObj.usosMax) {
            return res.status(400).json({ valido: false, msg: 'Código de descuento agotado' });
        }

        if (tipo === 'abono' && codigoObj.soloEntradas) {
            return res.status(400).json({ valido: false, msg: 'Este código solo es válido para entradas' });
        }

        if (tipo === 'entrada' && codigoObj.soloAbonos) {
            return res.status(400).json({ valido: false, msg: 'Este código solo es válido para abonos' });
        }

        let descuento = 0;
        if (codigoObj.tipo === 'porcentaje') {
            descuento = Math.round((montoNum * Number(codigoObj.valor)) / 100 * 100) / 100;
        } else {
            descuento = Math.min(Number(codigoObj.valor), montoNum);
        }

        const montoFinal = Math.max(0, montoNum - descuento);

        return res.json({
            valido: true,
            descuento,
            montoFinal,
            codigoId: codigoObj.id
        });

    } catch (error) {
        console.error('[codigos] Error aplicar-codigo:', error.message);
        return res.status(500).json({ msg: 'Error al aplicar el código de descuento' });
    }
};

/**
 * POST /api/interno/codigos — crear código
 */
const crearCodigo = async (req, res = response) => {
    try {
        const { codigo, tipo, valor, usosMax, fechaFin, activo, soloAbonos, soloEntradas } = req.body;

        if (!codigo || !valor) {
            return res.status(400).json({ msg: 'codigo y valor son obligatorios' });
        }

        const codigoNorm = codigo.toUpperCase().trim();
        const existente = await CodigoDescuento.findOne({ where: { codigo: codigoNorm } });
        if (existente) {
            return res.status(409).json({ msg: 'Ya existe un código con ese nombre' });
        }

        const nuevo = await CodigoDescuento.create({
            codigo: codigoNorm,
            tipo: tipo || 'porcentaje',
            valor,
            usosMax: usosMax || null,
            fechaFin: fechaFin || null,
            activo: activo !== undefined ? activo : true,
            soloAbonos: soloAbonos || false,
            soloEntradas: soloEntradas || false
        });

        return res.status(201).json({ ok: true, codigo: nuevo });
    } catch (error) {
        console.error('[codigos] Error crear:', error.message);
        return res.status(500).json({ msg: 'Error al crear el código' });
    }
};

/**
 * GET /api/interno/codigos — listar todos
 */
const listarCodigos = async (req, res = response) => {
    try {
        const codigos = await CodigoDescuento.findAll({ order: [['createdAt', 'DESC']] });
        return res.json({ ok: true, total: codigos.length, codigos });
    } catch (error) {
        console.error('[codigos] Error listar:', error.message);
        return res.status(500).json({ msg: 'Error al listar códigos' });
    }
};

/**
 * DELETE /api/interno/codigos/:id — desactivar (soft delete)
 */
const desactivarCodigo = async (req, res = response) => {
    try {
        const { id } = req.params;
        const codigo = await CodigoDescuento.findByPk(id);
        if (!codigo) return res.status(404).json({ msg: 'Código no encontrado' });

        codigo.activo = false;
        await codigo.save();

        return res.json({ ok: true, msg: 'Código desactivado' });
    } catch (error) {
        console.error('[codigos] Error desactivar:', error.message);
        return res.status(500).json({ msg: 'Error al desactivar el código' });
    }
};

module.exports = { aplicarCodigo, crearCodigo, listarCodigos, desactivarCodigo };
