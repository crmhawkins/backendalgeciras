const { Router } = require('express');

const router = Router();

const patrocinadores = [
  { nombre: 'Hawkins', logo: 'https://hawkins.es/logo.png', url: 'https://hawkins.es', tipo: 'principal' },
  { nombre: 'Capelli Sport', logo: 'https://backend-algeciras.hawkins.es/acf/2021/11/Capelli-Sport_Logo_White-scaled.png', url: 'https://capelli.com', tipo: 'equipacion' },
  { nombre: 'Yes Energy', logo: 'https://backend-algeciras.hawkins.es/acf/2024/11/Post-instagram-Yesenergy-1.png', url: '#', tipo: 'colaborador' },
  { nombre: 'Quirónsalud', logo: 'https://backend-algeciras.hawkins.es/acf/2021/11/20-quironsalud.svg', url: 'https://quironsalud.es', tipo: 'colaborador' },
];

router.get('/', (req, res) => res.json({ ok: true, patrocinadores }));

module.exports = router;
