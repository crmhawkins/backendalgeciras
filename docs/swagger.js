const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Algeciras CF API',
      version: '1.0.0',
      description: 'API para gestión de abonos, entradas y contenido del Algeciras CF',
    },
    servers: [{ url: 'https://backend-algeciras.hawkins.es' }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        basicAuth:  { type: 'http', scheme: 'basic' },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            ok:  { type: 'boolean', example: false },
            msg: { type: 'string',  example: 'Error description' },
          },
        },
        AuthToken: {
          type: 'object',
          properties: {
            ok:    { type: 'boolean', example: true },
            token: { type: 'string',  example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
          },
        },
      },
    },
  },
  apis: ['./routes/*.js'],
};

module.exports = swaggerJsdoc(options);
