// Imports
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const sequelize = require("./config/database");
const authRoutes = require("./routes/authRoutes");
const seatRoutes = require("./routes/seatRoutes");
const ticketRoutes = require("./routes/ticketRoutes");
require("dotenv").config();

// Inicialización del servidor
const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares 
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Rutas
app.use("/api/auth", authRoutes);
app.use("/api/seats", seatRoutes);
app.use("/api/tickets", ticketRoutes);

// Conexión a la base de datos y arranque del servidor
sequelize.sync({ force: false }).then(() => {
    console.log("Conectado a la base de datos");
    app.listen(PORT, () => {
        console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });
}).catch(err => console.error("Error al conectar la base de datos", err));
