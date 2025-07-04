/* 
    Creado por: David Montalba Gonzalez
    BootCamp Web Full Stack - KeepCondig XII
*/

'use strict';

const i18n = require('i18n');
const path = require('path');


i18n.configure({
    locales: ['en', 'es'],
    directory: path.join(__dirname, '..','locales'),
    defaultLocale: 'es',
    autoReload: true,  // watch for changes in JSON files to reload locale on updates - defaults to false
    syncFiles: true,  // sync locale information across all files - defaults to false
});


i18n.setLocale('es');



module.exports = i18n;