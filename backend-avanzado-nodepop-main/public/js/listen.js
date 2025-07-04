/* 
    Creado por: David Montalba Gonzalez
    BootCamp Web Full Stack - KeepCondig XII
*/

import { actualizarImagen, crearAnunciosHtml, editarAnuncio } from './anuncios.js';
import { obtenerAnunciosFiltrados } from './buscar.js';
import * as CRUD from './crud.js'
import { templateCrearAnuncio } from './helpers.js';
import { obtenerAnuncios } from './http-providers.js';

const contenedor = document.querySelector('#contenedor');
const divBuscar = document.querySelector('#mostrarAnuncios');


export const eventos = (event) => {

    try {
        document.addEventListener('click', async(e) => {
            // e es el evento, e.target es el elemento que lo disparó
            if(e.target.classList.contains('btnEditar')) {
                // Llamar a la función para cerrar sesión aquí
                const id = e.path[0].id;
                editarAnuncio(id);

            }
            if(e.target.classList.contains('btnActualizar')) {
                e.preventDefault();
                const form = document.forms[0];

                const inputNombre = form.querySelector('input[name="nombre"]');
                const nombre = inputNombre.value;

                const inputPrecio = form.querySelector('input[name="precio"]');
                const precio = inputPrecio.value;

                const inputVenta = form.querySelector('select[name="venta"]');
                const venta = inputVenta.options[inputVenta.selectedIndex].value;

                const inputTags = form.querySelector('input[name="tags"]');
                const tags = inputTags.value;

                const tagslimpios = tags.trim();
                const arraysTags = tagslimpios.split(',');

                Swal.fire({
                    title: 'Do you want to save the changes?',
                    showDenyButton: true,
                    showCancelButton: true,
                    confirmButtonText: 'Save',
                    denyButtonText: `Don't save`,
                  }).then((result) => {
                    /* Read more about isConfirmed, isDenied below */
                    if (result.isConfirmed) {
                        const id = e.path[0].id;
                        console.log(id);
                        CRUD.putAnuncio(id, {
                            nombre,
                            venta,
                            precio,
                            arraysTags

                        }).then(
                            Swal.fire('Saved!', '', 'success').then((res) => {
                                location.reload();
                                
                            })
                        );
                      
                    } else if (result.isDenied) {
                      Swal.fire('Changes are not saved', '', 'info')
                      location.reload();
                    };
                });

            }
            if(e.target.classList.contains('editarImagen')) {
                const id = e.path[0].id;
                actualizarImagen(id);                
            }
            if(e.target.classList.contains('btnActualizarImagen')) {
                e.preventDefault();
                const id = e.path[0].id;
                const form = document.forms[0];
                
                const inputArchivo = form.querySelector('input[type="file"]');

                let formData  = new FormData();
                formData.append('archivo', inputArchivo.files[0])

                CRUD.editarImagen(id, formData).then(
                    Swal.fire('Saved!', '', 'success').then((res) => {
                        location.reload();
                    })
                ); 
                
            }
            if(e.target.classList.contains('btnFiltros')) {
               
                e.preventDefault();
       
                if (divBuscar.children[0].matches('#contenedorForm')) {
                    divBuscar.children[0].remove();
                }
                
                const template = `
                <form action="">
                    <div class="cabecera">
                        <div class="sec d-inline-block  mb-3  mx-2">
                            <input class="form-control" type="text" name="nombre" id="nombre" placeholder="nombre a buscar">
                        </div>
                        <div class="sec d-inline-block  mb-3  mx-2">
                            <select name="venta" id="venta" class="form-select">
                                <option selected="selected" value="true">Venta</option>
                                <option value="false">Buscando</option>
                            </select>
                        </div>
                        <div class="sec d-inline-block  mb-3  mx-2">
                            <input class="form-control" type="number" name="minPrice" id="minPrice" placeholder="Precio minimo">
                        </div>
                        <div class="sec d-inline-block  mb-3  mx-2">
                            <input class="form-control" type="number" name="maxPrice" id="maxPrice" placeholder="Precio maximo">
                        </div>
                        <div class="sec d-inline-block  mb-3  mx-2">
                            <select name="order" id="order" class="form-select">
                                <option selected="selected" value="asc">Ascendente</option>
                                <option value="desc">Descendente</option>
                            </select>
                        </div>
                        <div class="sec d-inline-block  mb-3  mx-2">
                            <input class="form-control" type="text" name="tags" id="tags" placeholder="tags a buscar">
                            <button id="" class="btn btn-primary btnBuscar mb-3">Buscar</button>
                        </div>
                        </div>
                </form>
                `;

                const divAnuncios = document.createElement('div');
                divAnuncios.classList.add('animate__delay-2s')
                divAnuncios.classList.add('animate__animated')
                divAnuncios.classList.add('animate__bounce')
                divAnuncios.classList.add('animate__fadeIn')
                divAnuncios.classList.add('mt-2');
                divAnuncios.classList.add('container');

                        divAnuncios.id='contenedorForm';
                    
                        divAnuncios.innerHTML = template;
                        divBuscar.insertBefore (divAnuncios, contenedor);
                
                        contenedor.innerHTML = '';
                
                const data = await obtenerAnuncios();
                data.anuncios.forEach(crearAnunciosHtml );
            
            }
        
            if(e.target.classList.contains('btnBuscar')) {

                e.preventDefault();

                const filtros = {};
            
                const nombre = document.querySelector('#nombre');
                const venta = document.querySelector('#venta');
                const precioMinimo = document.querySelector('#minPrice');
                const precioMaximo = document.querySelector('#maxPrice');
                const orden = document.querySelector('#order');
                const tags = document.querySelector('#tags');


                if(nombre.value){
                    filtros.nombre = nombre.value;
                }
                if(venta){
                    filtros.venta = venta.value;
                }
                if(precioMinimo.value){
                    filtros.minPrice = precioMinimo.value;
                }
                if(precioMaximo.value){
                    filtros.maxPrice = precioMaximo.value;
                }
                if(orden){
                    filtros.order = orden.value;
                }
                if(!tags.value == ''){                
                    filtros.tags = tags;
                }
                    
                obtenerAnunciosFiltrados(filtros);
                
            }
            if(e.target.classList.contains('btnCrear')) {

                if (divBuscar.children[0].matches('#contenedorForm')) {
                    divBuscar.children[0].remove();
                }

                const template = templateCrearAnuncio();
                contenedor.innerHTML = '';
                contenedor.innerHTML = template;
            }
            if(e.target.classList.contains('btnCrearAnuncio')) {
                e.preventDefault();

                const btnImagen = document.querySelector('.editarImagen')
                const btnCrearAnuncio = document.querySelector('#btnCrearAnuncio');
                const nombreAnuncio = document.querySelector('#nombre');
                const precioAnuncio = document.querySelector('#precio');
                const ventaAnuncio = document.querySelector('#venta');
                const tagsAnuncio = document.querySelector('#tags');


                if (!nombreAnuncio.value) {
                    alert('El campo nombre es obligatorio')
                    return new Error('El proceso no se ha realizado');
                }
                if (!precioAnuncio.value) {
                    alert('El campo precio es obligatorio')
                    return new Error('El proceso no se ha realizado');

                }
                if (!tagsAnuncio.value) {
                    alert('El campo tags es obligatorio')
                    return new Error('El proceso no se ha realizado');

                }

                const data = {
                    nombre: nombreAnuncio.value,
                    precio: Number(precioAnuncio.value),
                    venta: Boolean(ventaAnuncio.value),
                    tags: tagsAnuncio.value
                }

                const response = await CRUD.crearAnuncio(data);
                
                if (response.status === 200) {
                    
                    Swal.fire('Su anuncio se creo correctamente, porfavor ahora añada una imagen a su anuncio');
                    nombreAnuncio.setAttribute('disabled', true);
                    precioAnuncio.setAttribute('disabled', true);
                    ventaAnuncio.setAttribute('disabled', true);
                    tagsAnuncio.setAttribute('disabled', true);
                    btnCrearAnuncio.setAttribute('disabled', true);
                    btnImagen.setAttribute('id', response.anuncio._id);
                    btnImagen.setAttribute('disabled', false);

                }else{
                    
                }
            }

        });

    } catch (error) {
        console.log(error);
    };
};