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
        
        // Buscar la entrada por token (sin required para no fallar si falta alguna relación)
        const entrada = await Entrada.findOne({ 
            where: { token: entradaId },
            include: [
                {
                    model: Partido,
                    attributes: ['equipoLocal', 'equipoVisitante', 'fecha', 'hora', 'escudoLocal', 'escudoVisitante'],
                    required: false
                },
                {
                    model: Asiento,
                    attributes: ['numero', 'fila', 'sectorId'],
                    required: false,
                    include: [{
                        model: Sector,
                        attributes: ['nombre'],
                        required: false
                    }]
                },
                {
                    model: Usuario,
                    attributes: ['nombre', 'email'],
                    required: false
                }
            ]
        });
        
        if (!entrada) {
            return res.status(404).json({ msg: 'Entrada no encontrada con ese token' });
        }
        
        // Obtener el token de la entrada
        const token = entrada.token || entradaId;
        
        // Verificar que todos los datos relacionados existen
        if (!entrada.Partido) {
            console.error('Error: Partido no encontrado para entrada', token);
            return res.status(500).json({ 
                msg: 'Error: No se encontró el partido asociado a esta entrada. Por favor, contacta con soporte.' 
            });
        }
        
        if (!entrada.Asiento) {
            console.error('Error: Asiento no encontrado para entrada', token);
            return res.status(500).json({ 
                msg: 'Error: No se encontró el asiento asociado a esta entrada. Por favor, contacta con soporte.' 
            });
        }
        
        if (!entrada.Asiento.Sector) {
            console.error('Error: Sector no encontrado para asiento', entrada.Asiento.id);
            return res.status(500).json({ 
                msg: 'Error: No se encontró el sector asociado al asiento. Por favor, contacta con soporte.' 
            });
        }
        
        if (!entrada.Usuario) {
            console.error('Error: Usuario no encontrado para entrada', token);
            return res.status(500).json({ 
                msg: 'Error: No se encontró el usuario asociado a esta entrada. Por favor, contacta con soporte.' 
            });
        }
        
        // Generar QR code como buffer
        const qrBuffer = await QRCode.toBuffer(token, {
            errorCorrectionLevel: 'H',
            type: 'png',
            width: 300,
            margin: 1
        });
        
        // Generar QR pequeño para las esquinas
        const qrSmallBuffer = await QRCode.toBuffer(token, {
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
        const pageHeight = doc.page.height;
        
        // Fondo blanco para el contenido central con mejor posicionamiento
        const contentWidth = 450;
        const contentTop = 120;
        const contentHeight = pageHeight - contentTop - 120;
        const contentLeft = centerX - contentWidth / 2;
        
        // Fondo blanco con borde
        doc.rect(contentLeft, contentTop, contentWidth, contentHeight)
           .fillColor('white')
           .fill()
           .strokeColor('#DC143C')
           .lineWidth(3)
           .stroke();
        
        // Título del partido (arriba) - con más espacio
        doc.fillColor('#DC143C')
           .fontSize(22)
           .font('Helvetica-Bold');
        
        const partidoText = `${entrada.Partido.equipoLocal} vs ${entrada.Partido.equipoVisitante}`;
        const partidoY = contentTop + 45;
        
        // Dibujar el texto del partido
        doc.text(partidoText, centerX, partidoY, { 
            align: 'center',
            width: contentWidth - 100
        });
        
        // Calcular altura aproximada del texto (tamaño de fuente + línea)
        const partidoLineHeight = 28; // Altura aproximada para fuente de 22px
        const partidoHeight = partidoText.length > 40 ? partidoLineHeight * 2 : partidoLineHeight;
        
        // Fecha y hora (debajo del título con MUCHO más espacio)
        const fechaPartido = new Date(entrada.Partido.fecha);
        const fechaStr = fechaPartido.toLocaleDateString('es-ES', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        
        // Calcular posición de la fecha (dejando espacio MUY generoso después del título)
        const fechaY = partidoY + partidoHeight + 50; // Aumentado de 35 a 50
        
        doc.fillColor('black')
           .fontSize(13)
           .font('Helvetica');
        
        // Calcular altura de la fecha (puede ser múltiples líneas)
        const fechaLineHeight = 18;
        const fechaHeight = fechaStr.length > 50 ? fechaLineHeight * 2 : fechaLineHeight;
        
        doc.text(fechaStr, centerX, fechaY, { 
            align: 'center',
            width: contentWidth - 100
        });
        
        let horaY = fechaY + fechaHeight + 25; // Aumentado de 20 a 25
        if (entrada.Partido.hora) {
            doc.fontSize(12)
               .text(`Hora: ${entrada.Partido.hora}`, centerX, horaY, { align: 'center' });
            horaY += 25; // Aumentado de 20 a 25
        }
        
        // Línea separadora (con más espacio después de la hora)
        const separatorY = horaY + 30; // Aumentado de 20 a 30
        doc.moveTo(contentLeft + 40, separatorY)
           .lineTo(contentLeft + contentWidth - 40, separatorY)
           .strokeColor('#DC143C')
           .lineWidth(2)
           .stroke();
        
        // QR grande en el centro (más abajo)
        const qrLargeSize = 220;
        const qrTop = separatorY + 30;
        const qrLeft = centerX - qrLargeSize / 2;
        doc.image(qrBuffer, qrLeft, qrTop, { 
            width: qrLargeSize, 
            height: qrLargeSize 
        });
        
        // Línea separadora después del QR
        const separatorY2 = qrTop + qrLargeSize + 20;
        doc.moveTo(contentLeft + 40, separatorY2)
           .lineTo(contentLeft + contentWidth - 40, separatorY2)
           .strokeColor('#DC143C')
           .lineWidth(2)
           .stroke();
        
        // Información del titular y asiento (debajo del QR)
        const infoStartY = separatorY2 + 30;
        const infoLeft = contentLeft + 50;
        const infoRight = contentLeft + contentWidth - 50;
        const lineHeight = 22;
        
        // Titular
        doc.fillColor('black')
           .fontSize(14)
           .font('Helvetica-Bold')
           .text('Titular:', infoLeft, infoStartY);
        doc.fontSize(14)
           .font('Helvetica')
           .text(entrada.Usuario.nombre, infoLeft + 80, infoStartY);
        
        // Sector
        doc.fontSize(14)
           .font('Helvetica-Bold')
           .text('Sector:', infoLeft, infoStartY + lineHeight);
        doc.fontSize(14)
           .font('Helvetica')
           .text(entrada.Asiento.Sector.nombre, infoLeft + 80, infoStartY + lineHeight);
        
        // Fila y Butaca
        doc.fontSize(14)
           .font('Helvetica-Bold')
           .text('Fila:', infoLeft, infoStartY + lineHeight * 2);
        doc.fontSize(14)
           .font('Helvetica')
           .text(entrada.Asiento.fila, infoLeft + 50, infoStartY + lineHeight * 2);
        
        doc.fontSize(14)
           .font('Helvetica-Bold')
           .text('Butaca:', infoLeft + 120, infoStartY + lineHeight * 2);
        doc.fontSize(14)
           .font('Helvetica')
           .text(entrada.Asiento.numero, infoLeft + 180, infoStartY + lineHeight * 2);
        
        // Token de la entrada (al final, pequeño)
        const tokenY = contentTop + contentHeight - 40;
        doc.fontSize(9)
           .fillColor('#666')
           .font('Helvetica')
           .text(`Token: ${token}`, centerX, tokenY, { align: 'center' });
        
        // Finalizar PDF
        doc.end();
        
    } catch (error) {
        console.error('Error al generar PDF:', error);
        console.error('Stack trace:', error.stack);
        
        // Si la respuesta ya fue enviada (por ejemplo, si el PDF empezó a generarse), no intentar enviar JSON
        if (!res.headersSent) {
            res.status(500).json({ 
                msg: 'Error al generar el PDF de la entrada',
                error: error.message,
                details: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        } else {
            // Si ya se enviaron headers, finalizar el stream de PDF
            if (res && typeof res.end === 'function') {
                res.end();
            }
        }
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
