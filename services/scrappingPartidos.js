const fetch = require('node-fetch');
const cheerio = require('cheerio');
const { Sequelize } = require('sequelize');
const Partido = require('../models/partido');
const { Op } = require('sequelize');
const {scrapEventosPartido} = require('./scrappingEventosPartidos');

// Parseo de fecha
function parsearFecha(fechaTexto) {
    const meses = {
        'Ene': '01', 'Feb': '02', 'Mar': '03', 'Abr': '04',
        'May': '05', 'Jun': '06', 'Jul': '07', 'Ago': '08',
        'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dic': '12'
    };

    const partes = fechaTexto.split(' ');
    if (partes.length !== 3) return null;

    const dia = partes[0];
    const mes = meses[partes[1]];
    const anio = '20' + partes[2];

    if (!mes) return null;

    return `${anio}-${mes}-${dia.padStart(2, '0')}`;
}

function esHoraValida(texto) {
    return /^\d{1,2}:\d{2}$/.test(texto);
}

function esMarcadorValido(texto) {
    return /^\d+\s*-\s*\d+$/.test(texto);
}

// Obtener imagen grande del escudo
async function obtenerEscudoGrande(urlEquipo) {
    try {
        const response = await fetch(`https://www.resultados-futbol.com${urlEquipo}`);
        const html = await response.text();
        const $ = cheerio.load(html);
        const imgGrande = $('#previewArea img').attr('src');
        return imgGrande || null;
    } catch (error) {
        console.error(`❌ Error al obtener escudo grande de ${urlEquipo}:`, error.message);
        return null;
    }
}


async function obtenerPartidos() {
    const now = new Date();
    const currentSeasonEndYear = now.getMonth() >= 6 ? now.getFullYear() + 1 : now.getFullYear();
    const url = `https://www.resultados-futbol.com/partidos/algeciras-cf/${currentSeasonEndYear}`;
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error('Error al cargar la página');
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const rows = $('table.tablemarcador tbody tr');

    const partidos = [];

    for (let i = 0; i < rows.length; i++) {
        const row = rows.eq(i);

        const fechaTexto = row.find('.time').text().trim() || '';
        const marcadorTexto = row.find('.score .marker_box')?.text().trim() || '';

        const equipoLocal = row.find('.team-home a').text().trim() || '';
        const equipoVisitante = row.find('.team-away a').text().trim() || '';

        const urlLocal = row.find('.team-home a').attr('href') || '';
        const urlVisitante = row.find('.team-away a').attr('href') || '';

        const fecha = parsearFecha(fechaTexto);
        if (!fecha || !equipoLocal || !equipoVisitante) continue;

        let hora = null;
        let marcador = null;

        if (esHoraValida(marcadorTexto)) {
            hora = marcadorTexto;
        } else if (esMarcadorValido(marcadorTexto)) {
            marcador = marcadorTexto.replace(/\s+/g, '');
        }

        const escudoLocal = await obtenerEscudoGrande(urlLocal);
        const escudoVisitante = await obtenerEscudoGrande(urlVisitante);

        partidos.push({
            fecha,
            hora,
            equipoLocal,
            escudoLocal,
            equipoVisitante,
            escudoVisitante,
            marcador
        });

        let partido = await Partido.findOne({
            where: {
              fecha,
              equipoLocal,
              equipoVisitante,
            }
          });
          
          if (!partido) {
            partido = await Partido.create({
              fecha,
              hora,
              equipoLocal,
              escudoLocal,
              equipoVisitante,
              escudoVisitante,
              marcador
            });
            console.log(`✅ Partido creado: ${equipoLocal} vs ${equipoVisitante} (${fecha})`);
            if (!hora && marcador && partido) {
                const urlSlugLocal = urlLocal.split('/').pop();
                const urlSlugVisitante = urlVisitante.split('/').pop();
                const resumenUrl = `https://www.resultados-futbol.com/partido/${urlSlugLocal}/${urlSlugVisitante}/summary`;
            
                await scrapEventosPartido(resumenUrl, partido.id);
            }
          } else {
            const clean = (value) => (value || '').trim();

            const necesitaActualizar =
            clean(partido.hora) !== clean(hora) ||
            clean(partido.marcador) !== clean(marcador) ||
            clean(partido.escudoLocal) !== clean(escudoLocal) ||
            clean(partido.escudoVisitante) !== clean(escudoVisitante);

          
            if (necesitaActualizar) {
              await partido.update({
                hora,
                marcador,
                escudoLocal,
                escudoVisitante
              });
              console.log(`🔄 Partido actualizado: ${equipoLocal} vs ${equipoVisitante} (${fecha})`);

                if (!hora && marcador && partido) {
                    const urlSlugLocal = urlLocal.split('/').pop();
                    const urlSlugVisitante = urlVisitante.split('/').pop();
                    const resumenUrl = `https://www.resultados-futbol.com/partido/${urlSlugLocal}/${urlSlugVisitante}/summary`;
                
                    await scrapEventosPartido(resumenUrl, partido.id);
                }
            }
          }

    }

    return partidos;
}

module.exports = { obtenerPartidos };
