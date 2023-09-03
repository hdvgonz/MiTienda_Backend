/* eslint-disable prettier/prettier */
/*Mapeo de variables de entorno*/

export const EnvConfiguration = () => ({
    environment: process.env.NODE_ENV || 'dev',
    db_host: process.env.DB_HOST,
    db_port: process.env.DB_PORT || 5432,
    port: process.env.PORT || 3000
})
