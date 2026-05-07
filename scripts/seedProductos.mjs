import { Sequelize, DataTypes } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

const db = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: false,
});

const Producto = db.define('Producto', {
    nombre: DataTypes.STRING,
    descripcion: DataTypes.TEXT,
    precio: DataTypes.DECIMAL(10, 2),
    precioAnterior: DataTypes.DECIMAL(10, 2),
    imagen: DataTypes.STRING,
    imagenes: DataTypes.JSON,
    categoria: DataTypes.ENUM('equipacion', 'accesorio', 'ropa', 'otro'),
    tallas: DataTypes.JSON,
    temporada: DataTypes.STRING,
    activo: DataTypes.BOOLEAN,
    destacado: DataTypes.BOOLEAN,
    orden: DataTypes.INTEGER,
}, {
    tableName: 'productos',
    freezeTableName: true,
    timestamps: true,
});

const TALLAS_ADULTO = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const TALLAS_TSHIRT = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

const productos = [
    {
        nombre: 'Camiseta 1ª Equipación 25/26',
        descripcion: 'Camiseta oficial Algeciras CF temporada 2025/26. Marca Capelli Sport. Diseño rojiblanco con columnas verticales, mangas y espalda blancas, hombros rojos.',
        precio: 55.00,
        precioAnterior: null,
        imagen: 'https://live.staticflickr.com/65535/54737133903_b3c9140247_c.jpg',
        imagenes: [
            'https://live.staticflickr.com/65535/54737133903_b3c9140247_c.jpg',
            'https://live.staticflickr.com/65535/54736081732_6397bdbe9d_c.jpg',
        ],
        categoria: 'equipacion',
        tallas: TALLAS_ADULTO,
        temporada: '25/26',
        activo: true,
        destacado: true,
        orden: 1,
    },
    {
        nombre: 'Camiseta 2ª Equipación 25/26',
        descripcion: 'Camiseta oficial Algeciras CF temporada 2025/26. Marca Capelli Sport. Diseño gris espacial y negro con detalles dorados.',
        precio: 55.00,
        precioAnterior: null,
        imagen: 'https://live.staticflickr.com/65535/54736081722_a612606790_b.jpg',
        imagenes: [
            'https://live.staticflickr.com/65535/54736081722_a612606790_b.jpg',
            'https://live.staticflickr.com/65535/54736915406_e4b00b714d_c.jpg',
        ],
        categoria: 'equipacion',
        tallas: TALLAS_ADULTO,
        temporada: '25/26',
        activo: true,
        destacado: true,
        orden: 2,
    },
    {
        nombre: 'Camiseta Equipación 24/25 (Liquidación)',
        descripcion: 'Camiseta oficial Algeciras CF temporada anterior. Marca Nike. Precio de liquidación — stock limitado.',
        precio: 29.95,
        precioAnterior: 55.00,
        imagen: null,
        imagenes: [],
        categoria: 'equipacion',
        tallas: TALLAS_ADULTO,
        temporada: '24/25',
        activo: true,
        destacado: false,
        orden: 3,
    },
    {
        nombre: 'Sudadera Algeciras CF',
        descripcion: 'Sudadera oficial del Algeciras CF con escudo bordado.',
        precio: 45.00,
        precioAnterior: null,
        imagen: null,
        imagenes: [],
        categoria: 'ropa',
        tallas: TALLAS_TSHIRT,
        temporada: null,
        activo: true,
        destacado: false,
        orden: 4,
    },
    {
        nombre: 'Gorra Algeciras CF',
        descripcion: 'Gorra oficial del Algeciras CF con escudo bordado. Talla única ajustable.',
        precio: 18.00,
        precioAnterior: null,
        imagen: null,
        imagenes: [],
        categoria: 'accesorio',
        tallas: ['Única'],
        temporada: null,
        activo: true,
        destacado: false,
        orden: 5,
    },
    {
        nombre: 'Toalla Algeciras CF',
        descripcion: 'Toalla oficial del Algeciras CF. 100% algodón.',
        precio: 22.00,
        precioAnterior: null,
        imagen: null,
        imagenes: [],
        categoria: 'accesorio',
        tallas: ['Única'],
        temporada: null,
        activo: true,
        destacado: false,
        orden: 6,
    },
];

async function seed() {
    try {
        await db.authenticate();
        await db.sync({ alter: false });

        const existing = await Producto.count();
        if (existing > 0) {
            console.log(`Ya existen ${existing} productos. Usa --force para reinsertar.`);
            if (!process.argv.includes('--force')) {
                process.exit(0);
            }
            await Producto.destroy({ where: {}, truncate: true });
            console.log('Tabla vaciada.');
        }

        await Producto.bulkCreate(productos);
        console.log(`✅ ${productos.length} productos insertados.`);
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    } finally {
        await db.close();
    }
}

seed();
