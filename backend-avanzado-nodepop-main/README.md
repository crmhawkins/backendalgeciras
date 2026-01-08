# NodePOP

## Para inicializar el proyecto:

Configurar la variables de entorno en el archivo .example.env
```shell
PORT=8080
MONGODB_CNN=
SECRETORPRIVATEKEY=
```

Luego, copiar el .example.env archivar en un nuevo .env archivo y complete los valores.

```shell
npm install
```

Después puedes instalar los datos iniciales de la base de datos con:

```shell
npm run initdb
```

(este proceso te pedira confirmación antes de ejecutarse)

## Para arrancar el proyecto:

* En producción:

```shell
npm run start
```

## Rutas de la Web

* http://localhost:8080/

Para mostrar los anuncios debes enviarle un token valido desde el header de la peticion, KEY = 'x-token'.
Home, muestra todos los anuncios, a esta URL podremos aplicar filtros y paginación para conseguir distintas listas.

### Con los filtros: 

* Nombre

* Venta ( siendo un producto a la venta si es 'true' y un producto buscado si es 'false' )

* Precio. (tenemos dos opciones minPrice - Precio minimo, maxPrice - Precio máximo)

* Orden. (podemos ordenar los anuncios a mostrar pasandole order=asc o order=desc)

* Tags (pudiendo separar los tags por comas y encontrando todos los anuncios que tengan uno u otro tag).

Algunos ejemplos de filtros pueden ser:
* https://backend-algeciras.hawkins.es/api/anuncios?nombre=c&minPrice=80&maxPrice=2000
* https://backend-algeciras.hawkins.es/api/anuncios?sort=asc&limite=2&desde=1
* https://backend-algeciras.hawkins.es/api/anuncios?tags=mobile&venta=false
* https://backend-algeciras.hawkins.es/api/anuncios?tags=clothing,lifestyle

## Rutas del API

* https://backend-algeciras.hawkins.es/api/anuncios

Devuelve un json con todos los anuncios existentes. Sobre esta url podremos aplicar filtros para modificar la búsqueda.

El método y filtros son los mismos explicados con anterioridad en las rutas de la Web.

Mediante POST podemos añadir un nuevo anuncio. 
Con DELETE podremos eliminar un anuncio, introduciendo su ID al final de la ruta, 'https://backend-algeciras.hawkins.es/api/anuncios/:id'.

* https://backend-algeciras.hawkins.es/api/anuncios/tags

Busca entre todos los anuncios y devuelve una lista de todos los tags utilizados.

## Subida de Imagenes

* http://localhost:8080/api/anuncios

Para la subida de una imagen del anuncio. La imagen se enviara por form-data con el parametro 'archivo';

## Login user

* http://localhost:8080/api/authenticate



