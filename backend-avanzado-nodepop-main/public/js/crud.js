/* 
    Creado por: David Montalba Gonzalez
    BootCamp Web Full Stack - KeepCondig XII
*/

const urlCRUD = 'http://localhost:8080/api/anuncios/';
const urlImageCRUD = 'http://localhost:8080/api/uploads/anuncios';
const urlCRUDFiltro = 'http://localhost:8080/api/anuncios/?';


const getAnuncio = async (id) => {

    const resp = await fetch(`${urlCRUD}${id}`);
    const data = await resp.json();

    return data;
}

const putAnuncio = async ( id, usuario ) => {

    const resp = await fetch(`${urlCRUD}${id}`, {
        method: 'PUT',
        body: JSON.stringify( usuario ),
        headers: {
            'Content-Type': 'application/json'
        }
    });
    const data = await resp.json();

    return data;
}

const editarImagen = async ( id, FormData ) => {
console.log(FormData);
    const resp = await fetch(`${urlImageCRUD}/${id}`, {
        method: 'PUT',
        body: FormData,
    });
    const data = await resp.json();

    return data;
}


const filtrarAnuncios = async (filtros) => {
    
    let url = urlCRUDFiltro;

    const filtrar = {};
    if(filtros.nombre){

        filtrar.nombre = filtros.nombre;
        url += 'nombre='+ filtros.nombre +'&';

    }
    if(filtros.venta){
        filtrar.venta = filtros.venta;
        url += 'venta='+ filtros.venta +'&';
    }
    if(filtros.minPrice){
        filtrar.minPrice = filtros.minPrice;
        url += 'minPrice='+ filtros.minPrice +'&';
    }
    if(filtros.maxPrice){
        filtrar.maxPrice = filtros.maxPrice;
        url += 'maxPrice='+ filtros.maxPrice +'&';
    }
   if(filtros.order){
       filtrar.order = filtros.order;
        url += 'order='+ filtros.order +'&';
   }
   if(filtros.tags){
        const tagsValues = filtros.tags.trim();
        const tagsFinal = tagsValues.split(',');

        filtrar.tags = tagsFinal;
        tagsFinal.forEach( tag => {
            url += 'tags='+ tag +'&';
        });

   }
    
    try {
        const resp = await fetch( `${url}` );
        const data = await resp.json();
        return data;

    } catch (error) {
        throw error;
    }

}


const crearAnuncio = async ( dataBody ) => {

        const resp = await fetch(`${urlCRUD}`, {
            method: 'POST',
            body: JSON.stringify( dataBody ),
            headers: {
            'Content-Type': 'application/json'
            }
        });
        const status = resp.status;
        const data = await resp.json();
        const response = {
            status,
            ...data
        }
        return response;
    }


export{
    getAnuncio,
    putAnuncio,
    editarImagen,
    filtrarAnuncios,
    crearAnuncio
}