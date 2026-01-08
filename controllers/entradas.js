const { response } = require('express');

const generarPDFEntrada = async (req, res = response) => {
    const { entradaId } = req.params; // entradaId es el token en la URL
    
    try {
        const QRCode = require('qrcode');
        const PDFDocument = require('pdfkit');
        const Entrada = require('../models/entrada');
        const Partido = require('../models/partido');
        const Asiento = require('../models/asiento');
        const Sector = require('../models/sector');
        const Usuario = require('../models/usuario');
        
        // Buscar la entrada por token
        const entrada = await Entrada.findOne({ 
            where: { token: entradaId },
            include: [
                {
                    model: Partido,
                    attributes: ['equipoLocal', 'equipoVisitante', 'fecha', 'hora', 'escudoLocal', 'escudoVisitante']
                },
                {
                    model: Asiento,
                    attributes: ['numero', 'fila'],
                    include: [{
                        model: Sector,
                        attributes: ['nombre']
                    }]
                },
                {
                    model: Usuario,
                    attributes: ['nombre', 'email']
                }
            ]
        });
        
        if (!entrada) {
            return res.status(404).json({ msg: 'Entrada no encontrada' });
        }
        
        // Generar QR code como buffer
        const qrBuffer = await QRCode.toBuffer(entradaId, {
            errorCorrectionLevel: 'H',
            type: 'png',
            width: 300,
            margin: 1
        });
        
        // Generar QR pequeño para las esquinas
        const qrSmallBuffer = await QRCode.toBuffer(entradaId, {
            errorCorrectionLevel: 'H',
            type: 'png',
            width: 100,
            margin: 1
        });
        
        // Crear PDF
        const doc = new PDFDocument({
            size: 'A4',
            margin: 50
        });
        
        // Configurar headers para descarga
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="entrada-${token.substring(0, 8)}.pdf"`);
        
        // Pipe del PDF a la respuesta
        doc.pipe(res);
        
        // Fondo rojo (simulado con rectángulo)
        doc.rect(0, 0, doc.page.width, doc.page.height)
           .fillColor('#DC143C')
           .fill();
        
        // QR codes en las esquinas (sobre fondo blanco)
        const qrSize = 80;
        const margin = 20;
        
        // Esquina superior izquierda
        doc.save();
        doc.rect(margin, margin, qrSize, qrSize)
           .fillColor('white')
           .fill();
        doc.image(qrSmallBuffer, margin + 10, margin + 10, { width: qrSize - 20, height: qrSize - 20 });
        doc.restore();
        
        // Esquina superior derecha
        doc.save();
        doc.rect(doc.page.width - margin - qrSize, margin, qrSize, qrSize)
           .fillColor('white')
           .fill();
        doc.image(qrSmallBuffer, doc.page.width - margin - qrSize + 10, margin + 10, { width: qrSize - 20, height: qrSize - 20 });
        doc.restore();
        
        // Esquina inferior izquierda
        doc.save();
        doc.rect(margin, doc.page.height - margin - qrSize, qrSize, qrSize)
           .fillColor('white')
           .fill();
        doc.image(qrSmallBuffer, margin + 10, doc.page.height - margin - qrSize + 10, { width: qrSize - 20, height: qrSize - 20 });
        doc.restore();
        
        // Esquina inferior derecha
        doc.save();
        doc.rect(doc.page.width - margin - qrSize, doc.page.height - margin - qrSize, qrSize, qrSize)
           .fillColor('white')
           .fill();
        doc.image(qrSmallBuffer, doc.page.width - margin - qrSize + 10, doc.page.height - margin - qrSize + 10, { width: qrSize - 20, height: qrSize - 20 });
        doc.restore();
        
        // Contenido central
        const centerX = doc.page.width / 2;
        const centerY = doc.page.height / 2;
        
        // Fondo blanco para el contenido central
        const contentWidth = 400;
        const contentHeight = 500;
        doc.rect(centerX - contentWidth / 2, centerY - contentHeight / 2, contentWidth, contentHeight)
           .fillColor('white')
           .fill();
        
        // QR grande en el centro
        const qrLargeSize = 250;
        doc.image(qrBuffer, centerX - qrLargeSize / 2, centerY - qrLargeSize / 2 - 100, { 
            width: qrLargeSize, 
            height: qrLargeSize 
        });
        
        // Texto del partido
        doc.fillColor('black')
           .fontSize(24)
           .font('Helvetica-Bold')
           .text(`${entrada.Partido.equipoLocal} vs ${entrada.Partido.equipoVisitante}`, 
                 centerX, centerY + qrLargeSize / 2 + 20, { align: 'center' });
        
        // Fecha y hora
        const fechaPartido = new Date(entrada.Partido.fecha);
        const fechaStr = fechaPartido.toLocaleDateString('es-ES', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        doc.fontSize(14)
           .font('Helvetica')
           .text(fechaStr, centerX, centerY + qrLargeSize / 2 + 60, { align: 'center' });
        
        if (entrada.Partido.hora) {
            doc.text(`Hora: ${entrada.Partido.hora}`, centerX, centerY + qrLargeSize / 2 + 80, { align: 'center' });
        }
        
        // Datos del titular
        doc.fontSize(16)
           .font('Helvetica-Bold')
           .text('Titular:', centerX, centerY + qrLargeSize / 2 + 120, { align: 'center' });
        doc.fontSize(14)
           .font('Helvetica')
           .text(`${entrada.Usuario.nombre}`, centerX, centerY + qrLargeSize / 2 + 145, { align: 'center' });
        
        // Datos del asiento
        doc.fontSize(12)
           .text(`Sector: ${entrada.Asiento.Sector.nombre}`, centerX, centerY + qrLargeSize / 2 + 170, { align: 'center' });
        doc.text(`Fila: ${entrada.Asiento.fila} - Butaca: ${entrada.Asiento.numero}`, 
                 centerX, centerY + qrLargeSize / 2 + 190, { align: 'center' });
        
        // Token de la entrada (pequeño)
        doc.fontSize(8)
           .fillColor('#666')
           .text(`Token: ${token}`, centerX, centerY + qrLargeSize / 2 + 220, { align: 'center' });
        
        // Finalizar PDF
        doc.end();
        
    } catch (error) {
        console.error('Error al generar PDF:', error);
        res.status(500).json({ 
            msg: 'Error al generar el PDF de la entrada',
            error: error.message 
        });
    }
};

// Funciones placeholder para mantener compatibilidad con routes
const entradaGet = async (req, res) => {
    res.status(501).json({ msg: 'Función no implementada aún' });
};

const entradaPost = async (req, res) => {
    res.status(501).json({ msg: 'Función no implementada aún. Use /api/pagos/entrada para comprar entradas.' });
};

const buscarEntradaLiberada = async (req, res) => {
    res.status(501).json({ msg: 'Función no implementada aún' });
};

module.exports = {
    generarPDFEntrada,
    entradaGet,
    entradaPost,
    buscarEntradaLiberada
};
