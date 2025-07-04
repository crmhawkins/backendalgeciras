'use strict';

import fsPromise from 'fs/promises';
import readline from 'readline';
import mongoose from 'mongoose';


import {dbConnection} from './database/config.js';
import Anuncio from './models/anuncio.js';
import Usuario from './models/usuario.js';
import bcryptjs from 'bcryptjs';

// Conectamos a la Base de Datos


async function main() {
    dbConnection();

    const borrar = await pregunta('Estas seguro de que quieres borrar la base de datos?');
    if (!borrar) {
      process.exit(0);
    }
  
    // inicializar agentes
    await initAnuncios();
  
    // desconectar la base de datos
    mongoose.connection.close()
}

  async function initAnuncios() {
    // borrar todos los documentos de agentes que haya en la colección
    const deleted = await Anuncio.deleteMany();
    console.log(`Eliminados ${deleted.deletedCount} anuncios.`);

    const deletedUser = await Usuario.deleteMany();
    console.log(`Eliminados ${deletedUser.deletedCount} usuarios.`);
  
    const data = await fsPromise.readFile('initDB.anuncios.json', 'utf-8');
    const dataUser = await fsPromise.readFile('initDB.usuarios.json', 'utf-8');

    const anuncioData = JSON.parse(data);
    const userData = JSON.parse(dataUser);

    for (let i = 0; i < userData.length; i++) {
      const salt = bcryptjs.genSaltSync();
      userData[i].password = bcryptjs.hashSync(userData[i].password, salt);      
    }
    
    // crear agentes iniciales
    const anuncio = await Anuncio.insertMany(anuncioData);
    console.log(`Creados ${anuncio.length} Anuncios.`);

    const usuario = await Usuario.insertMany(userData);
    console.log(`Creados ${usuario.length} Usuarios.`);
    


  }

  function pregunta(texto) {
    return new Promise((resolve, reject) => {
      // conectar readline a la consola
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      // hacemos pregunta
      rl.question(texto, respuesta => {
        rl.close();
        if (respuesta.toLowerCase() === 'si') {
          resolve(true);
          return;
        }
        resolve(false);
      })
    });
  }

  main();