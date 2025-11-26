# Guía de Despliegue del Frontend (Next.js)

Esta guía cubre el despliegue del frontend en Vercel y cómo actualizarlo.

---

## 📦 Despliegue Inicial en Vercel

### Prerrequisitos
- Cuenta en [Vercel](https://vercel.com)
- Repositorio Git con el código del frontend
- Backend ya desplegado en Railway

### Pasos para Despliegue

#### 1. Preparar el Proyecto

Asegúrate de tener configurado:
- ✅ `package.json` con scripts de build
- ✅ `next.config.ts` configurado
- ✅ `.gitignore` que excluya `node_modules` y `.env.local`

#### 2. Desplegar en Vercel

**Opción A: Desde la Interfaz Web (Recomendada)**

1. Ir a [vercel.com](https://vercel.com)
2. Click en "Add New Project"
3. Importar tu repositorio de GitHub
4. Vercel detectará automáticamente que es un proyecto Next.js
5. Configurar variables de entorno (ver paso 3)
6. Click en "Deploy"

**Opción B: Desde la CLI**

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Desplegar
cd tienda_ropa_mvp-frontend
vercel
```

#### 3. Configurar Variables de Entorno

En Vercel Dashboard → Settings → Environment Variables:

```env
NEXT_PUBLIC_API_URL=https://tu-proyecto.up.railway.app
```

> [!IMPORTANT]
> Asegúrate de usar la URL correcta de tu backend en Railway

#### 4. Configurar Dominio (Opcional)

1. En Vercel Dashboard → Settings → Domains
2. Añadir dominio personalizado
3. Configurar DNS según las instrucciones

#### 5. Verificar Despliegue

- Frontend estará disponible en: `https://tu-proyecto.vercel.app`
- Verificar que se conecta correctamente al backend

---

## 🔄 Actualizar el Frontend

### Actualización Automática

Vercel redespliega automáticamente cuando haces push:

```bash
# 1. Hacer cambios en el código
git add .
git commit -m "feat: nueva funcionalidad en el carrito"
git push origin main

# 2. Vercel detecta el push y redespliega automáticamente
# 3. Monitorear en Vercel Dashboard
```

### Proceso Detallado

#### 1. **Cambios en Componentes**

```bash
# Ejemplo: Modificar página del carrito
# 1. Editar app/carrito/page.tsx
# 2. Probar localmente
npm run dev

# 3. Verificar que funciona
# 4. Commit y push
git add app/carrito/page.tsx
git commit -m "feat: mejorar UI del carrito"
git push origin main
```

#### 2. **Añadir Nuevas Dependencias**

```bash
# 1. Instalar nueva librería
npm install nueva-libreria

# 2. Usar en tu código
# 3. Commit package.json y package-lock.json
git add package.json package-lock.json
git commit -m "deps: añadir nueva-libreria"
git push origin main

# Vercel instalará automáticamente las nuevas dependencias
```

#### 3. **Cambios en Variables de Entorno**

```bash
# Desde Vercel Dashboard:
# 1. Settings → Environment Variables
# 2. Añadir/editar variable
# 3. Click en "Redeploy" para aplicar cambios
```

#### 4. **Cambios en Configuración**

```bash
# Si modificas next.config.ts
git add next.config.ts
git commit -m "config: actualizar configuración de Next.js"
git push origin main
```

---

## 🧪 Mejores Prácticas

### Antes de Actualizar

1. **Probar Localmente**
   ```bash
   npm run dev
   # Verificar que todo funciona
   ```

2. **Build Local**
   ```bash
   npm run build
   # Asegurarse de que el build funciona sin errores
   ```

3. **Verificar Conexión con Backend**
   ```bash
   # Asegurarse de que NEXT_PUBLIC_API_URL apunta al backend correcto
   ```

### Durante la Actualización

1. **Monitorear Build en Vercel**
   - Ver logs en tiempo real
   - Verificar que no hay errores de build

2. **Preview Deployments**
   - Vercel crea previews automáticos para cada PR
   - Probar cambios antes de mergear a main

### Después de Actualizar

1. **Verificar Producción**
   - Visitar la URL de producción
   - Probar funcionalidad nueva
   - Verificar que no se rompió nada

2. **Revisar Performance**
   - Vercel Analytics (si está habilitado)
   - Lighthouse scores

---

## 🚨 Rollback

Si algo sale mal:

### Opción 1: Desde Vercel Dashboard

1. Ir a Deployments
2. Encontrar un deployment anterior exitoso
3. Click en los tres puntos → "Promote to Production"

### Opción 2: Revertir Commit

```bash
git revert HEAD
git push origin main
```

---

## 📋 Checklist de Actualización Frontend

- [ ] Probar cambios localmente con `npm run dev`
- [ ] Ejecutar `npm run build` para verificar que compila
- [ ] Actualizar dependencias si es necesario
- [ ] Commit con mensaje descriptivo
- [ ] Push a la rama principal
- [ ] Monitorear build en Vercel
- [ ] Verificar deployment en producción
- [ ] Probar funcionalidad nueva
- [ ] Verificar que la conexión con el backend funciona

---

## 🔧 Comandos Útiles

### Vercel CLI

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Ver logs
vercel logs

# Listar deployments
vercel ls

# Ver información del proyecto
vercel inspect

# Desplegar a producción
vercel --prod

# Desplegar preview
vercel
```

### Next.js Local

```bash
# Desarrollo
npm run dev

# Build de producción
npm run build

# Iniciar servidor de producción localmente
npm run start

# Linting
npm run lint
```

---

## 🌐 Conectar Frontend y Backend

### Configuración de CORS en Backend

Asegúrate de que el backend permita requests desde el dominio de Vercel:

```python
# En app/main.py
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Local
        "https://tu-proyecto.vercel.app",  # Producción
        "https://*.vercel.app",  # Preview deployments
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Variables de Entorno por Ambiente

Vercel permite diferentes variables para diferentes ambientes:

- **Production**: Variables para producción
- **Preview**: Variables para preview deployments
- **Development**: Variables para desarrollo local

---

## 💡 Consejos

1. **Preview Deployments**
   - Cada PR crea un preview deployment automático
   - Úsalos para probar cambios antes de mergear

2. **Protección de Rama Main**
   - Configura GitHub para requerir reviews antes de mergear
   - Previene despliegues accidentales

3. **Monitoreo**
   - Habilita Vercel Analytics
   - Configura alertas para errores

4. **Performance**
   - Usa Next.js Image Optimization
   - Implementa lazy loading
   - Minimiza bundle size

5. **SEO**
   - Configura metadata en cada página
   - Usa Server Components cuando sea posible

---

## 📚 Recursos

- [Documentación de Vercel](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Vercel CLI Reference](https://vercel.com/docs/cli)
