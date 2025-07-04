/* 
    Creado por: David Montalba Gonzalez
    BootCamp Web Full Stack - KeepCondig XII
*/

const templateCrearAnuncio = () => {
    
    const template = `
    <form class="w-50 animate__delay-1s animate__animated animate__bounce animate__fadeIn">
        <div class="mb-3">
            <label for="nombre" class="form-label">Nombre del anuncio</label>
            <input type="text" class="form-control" id="nombre" aria-describedby="nombre" required>
        </div>
        <div class="mb-3">
            <label for="precio" class="form-label">Precio del anuncio</label>
            <input type="number" class="form-control" id="precio" aria-describedby="precio" required>
        </div>
        <div class="mb-3">
            <label for="venta" class="form-label">Venta</label>
            <select name="venta" id="venta" class="form-select">
                <option value="true">Venta</option>
                <option value="false">Buscando</option>
            </select>
        </div>
        <div class="mb-3">
            <label for="tags" class="form-label">Tags del anuncio - <small>Separación de palabras por , (coma)</small></label>
            <input type="text" class="form-control" id="tags" aria-describedby="nombre" required>
        </div>
        <button id="btnCrearAnuncio" type="submit" class="btn btn-primary btnCrearAnuncio">Crear Anuncio </button>

        <botton type="submit" id="" class="btn btn-info btn-sm my-4 editarImagen btn-lg d-block" disabled="true">Subir Imagen</botton>
    </form>
    `;

    return template;
}


export {
    templateCrearAnuncio
}