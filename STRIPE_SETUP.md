# Configuración de Stripe

Este documento explica cómo configurar el sistema de pagos con Stripe en modo de prueba.

## Variables de Entorno Requeridas

Agrega las siguientes variables a tu archivo `.env`:

```env
# Stripe API Keys (modo de prueba)
STRIPE_SECRET_KEY=sk_test_tu_clave_secreta_aqui
STRIPE_WEBHOOK_SECRET=whsec_tu_secreto_webhook_aqui

# URL del frontend (para redirecciones después del pago)
FRONTEND_URL=http://localhost:3000
```

## Pasos para Configurar Stripe

### 1. Crear una cuenta en Stripe

1. Ve a [https://stripe.com](https://stripe.com)
2. Crea una cuenta (o inicia sesión si ya tienes una)
3. Activa el modo de prueba (Test mode)

### 2. Obtener las API Keys

1. En el Dashboard de Stripe, ve a **Developers** > **API keys**
2. Copia la **Secret key** (empieza con `sk_test_`)
3. Agrégala a tu archivo `.env` como `STRIPE_SECRET_KEY`

### 3. Configurar Webhooks (Opcional pero recomendado)

Los webhooks permiten que Stripe notifique a tu servidor cuando ocurren eventos importantes (como pagos completados).

1. En el Dashboard de Stripe, ve a **Developers** > **Webhooks**
2. Click en **Add endpoint**
3. URL del endpoint: `https://tu-dominio.com/api/pagos/webhook`
4. Selecciona los eventos:
   - `checkout.session.completed`
5. Copia el **Signing secret** (empieza con `whsec_`)
6. Agrégala a tu archivo `.env` como `STRIPE_WEBHOOK_SECRET`

**Nota:** Para desarrollo local, puedes usar [Stripe CLI](https://stripe.com/docs/stripe-cli) para reenviar eventos a tu servidor local.

### 4. Instalar dependencias

```bash
npm install
```

Esto instalará la librería `stripe` que ya está agregada en `package.json`.

## Flujo de Pago

### Para Entradas

1. El usuario completa el formulario de compra de entradas
2. El frontend llama a `/api/pagos/entrada` con los datos del formulario
3. El backend crea una sesión de pago en Stripe y devuelve la URL de Checkout
4. El usuario es redirigido a Stripe Checkout para completar el pago
5. Después del pago, Stripe redirige a `/pago-exitoso?session_id=xxx`
6. La página de éxito llama a `/api/pagos/confirmar?session_id=xxx`
7. El backend verifica el pago y crea la entrada en la base de datos

### Para Abonos

El flujo es similar, pero usa `/api/pagos/abono` en lugar de `/api/pagos/entrada`.

## Base de Datos

El sistema crea una tabla `pago_sessions` para almacenar las sesiones de pago pendientes. Asegúrate de ejecutar las migraciones o crear la tabla manualmente.

### Estructura de la tabla `pago_sessions`:

- `id`: INT (auto-incremental)
- `stripeSessionId`: VARCHAR (único, ID de sesión de Stripe)
- `tipo`: ENUM('entrada', 'abono')
- `estado`: ENUM('pendiente', 'completado', 'cancelado', 'expirado')
- `datosCompra`: TEXT (JSON con los datos de la compra)
- `monto`: DECIMAL(10, 2)
- `fechaExpiracion`: DATETIME
- `createdAt`: DATETIME
- `updatedAt`: DATETIME

## Tarjetas de Prueba

Stripe proporciona tarjetas de prueba para el modo de prueba:

- **Tarjeta exitosa:** `4242 4242 4242 4242`
- **Tarjeta rechazada:** `4000 0000 0000 0002`
- **Requiere autenticación 3D Secure:** `4000 0025 0000 3155`

Para todas las tarjetas de prueba:
- Fecha de expiración: cualquier fecha futura (ej: 12/25)
- CVC: cualquier 3 dígitos (ej: 123)
- Código postal: cualquier código válido

## Solución de Problemas

### Error: "No se recibió la URL de pago"

- Verifica que `STRIPE_SECRET_KEY` esté configurada correctamente
- Asegúrate de que la clave sea de modo de prueba (empieza con `sk_test_`)

### Error: "El pago no ha sido completado"

- Verifica que el `session_id` sea válido
- Asegúrate de que el pago se haya completado en Stripe Checkout

### Webhook no funciona

- Verifica que `STRIPE_WEBHOOK_SECRET` esté configurado
- Asegúrate de que la URL del webhook sea accesible públicamente
- Para desarrollo local, usa Stripe CLI

## Recursos Adicionales

- [Documentación de Stripe](https://stripe.com/docs)
- [Stripe Checkout](https://stripe.com/docs/payments/checkout)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Stripe Testing](https://stripe.com/docs/testing)
