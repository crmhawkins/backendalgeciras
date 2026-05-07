'use strict';
const { Router } = require('express');
const router = Router();

router.get('/', (req, res) => {
    res.json({
        nombre: 'Estadio Municipal El Mirador',
        ciudad: 'Algeciras',
        provincia: 'Cádiz',
        capacidad: 8500,
        inauguracion: 1967,
        direccion: 'Calle El Mirador, s/n, Algeciras, Cádiz',
        coordenadas: { lat: 36.1271, lng: -5.4536 },
        cesped: 'Natural',
        iluminacion: true,
        temporada: '2024/25',
        competicion: 'Primera RFEF · Grupo 2',
        fundacion_club: 1912,
        colores: ['Rojo', 'Blanco'],
        imagen: 'https://backend-algeciras.hawkins.es/acf/2025/10/Diseno-sin-titulo-94.png',
    });
});

module.exports = router;
