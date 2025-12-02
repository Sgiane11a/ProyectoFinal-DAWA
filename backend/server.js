import express from "express";
import sequelize from "./config/database.js";

const app = express();

app.use(express.json());

// Verificar conexión
sequelize
  .authenticate()
  .then(() => console.log("Conectado a MySQL correctamente"))
  .catch(err => console.error("Error al conectar a MySQL:", err));

const PORT = process.env.PORT || 3306;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
