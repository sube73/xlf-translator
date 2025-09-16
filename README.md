# XLF Translator - Render Native

**Versión 2.0** - Implementación completamente nativa para Render sin rastros de Netlify

## 📁 Estructura de archivos

```
render/
├── server.js              # Servidor Express principal
├── package.json            # Dependencias Node.js
├── render.yaml            # Configuración Render (opcional)
├── index.html             # Frontend completo
├── api/
│   ├── process-xlf.js     # API de procesamiento XLF
│   └── generate-context.js # API de generación de contexto
└── README.md              # Este archivo
```

## 🚀 Primeros pasos para Deploy en Render

### Paso 1: Preparar el repositorio

1. **Crear carpeta render/ en tu proyecto:**
   ```bash
   mkdir render
   cd render
   ```

2. **Copiar todos los archivos generados:**
   - `server.js`
   - `package.json` 
   - `render.yaml` (opcional)
   - `index.html`
   - Crear carpeta `api/` y copiar:
     - `process-xlf.js` → renombrar a `api/process-xlf.js`
     - `generate-context.js` → renombrar a `api/generate-context.js`

3. **Commit al repositorio:**
   ```bash
   git add .
   git commit -m "Add Render native implementation v2.0"
   git push origin main
   ```

### Paso 2: Crear servicio en Render

1. **Ir a tu dashboard de Render** (https://dashboard.render.com)

2. **Crear nuevo Web Service:**
   - Click **"New +"** → **"Web Service"**
   - **"Build and deploy from a Git repository"**

3. **Conectar repositorio:**
   - Selecciona tu repositorio GitHub
   - Si no aparece, click **"Configure GitHub"** para autorizar

### Paso 3: Configuración del servicio

**Configuración básica:**
```
Service Name: xlf-translator-render
Runtime: Node
Region: Oregon (US West) [más barato]
Branch: main
Root Directory: render/
```

**Build & Deploy Settings:**
```
Build Command: npm ci
Start Command: npm start
```

**Instance Type:**
```
Free (para testing)
o 
Starter ($7/month) - recomendado para producción
```

### Paso 4: Variables de entorno

En la sección **"Environment"**:

```
Key: CLAUDE_API_KEY
Value: [tu API key de Claude - el mismo que usas en Netlify]

Key: NODE_ENV  
Value: production

Key: LOG_LEVEL
Value: info
```

**⚠️ IMPORTANTE:** No hagas público tu CLAUDE_API_KEY

### Paso 5: Deploy inicial

1. **Click "Create Web Service"**

2. **Observar logs de deploy en tiempo real:**
   - Debería instalar dependencias con `npm ci`
   - Iniciar el servidor con `npm start`
   - Mostrar mensaje: "🚀 XLF Translator - Render Native Server"

3. **URL de tu app:**
   - Render te asignará una URL como: `https://xlf-translator-render-xyz.onrender.com`

### Paso 6: Verificación inicial

**Tests básicos después del deploy:**

1. **Health check:**
   ```
   GET https://tu-app.onrender.com/health
   
   Respuesta esperada:
   {
     "status": "healthy",
     "service": "xlf-translator-render",
     "timestamp": "...",
     "uptime": 123.45
   }
   ```

2. **Frontend:**
   - Abrir la URL principal
   - ¿Se ve la interfaz XLF Translator?
   - ¿Aparece "Render Native v2.0" en el header?

3. **API endpoints:**
   ```
   POST https://tu-app.onrender.com/api/generate-context
   POST https://tu-app.onrender.com/api/process-xlf
   ```

### Paso 7: Test completo funcional

1. **Subir un archivo XLF pequeño**

2. **Probar flujo completo:**
   - Process XLF → ¿genera contexto?
   - Translate XLF → ¿se completa sin timeout?
   - Download XLF → ¿descarga correctamente?

3. **Verificar logs:**
   - En Render dashboard → "Logs"
   - ¿Ves mensajes de tu aplicación?
   - ¿Hay errores inesperados?

## ⚙️ Configuración avanzada (opcional)

### Custom Domain

Si tienes un dominio propio:

1. **En Render dashboard:**
   - Settings → Custom Domains
   - Add Custom Domain → `tu-dominio.com`

2. **En tu DNS provider:**
   - Agregar CNAME record: `CNAME tu-dominio.com xyz.onrender.com`

### Scaling

Para más capacidad:

1. **Upgrade a Starter ($7/month):**
   - 512 MB RAM
   - Sin sleeping
   - Custom domains incluidos

2. **Upgrade a Standard ($25/month):**
   - 2 GB RAM
   - Auto-scaling
   - Priority support

### Monitoreo

**Render proporciona:**
- Logs en tiempo real
- Métricas de CPU/RAM
- Health checks automáticos
- Deploy history
- Error alerting

## 🔧 Troubleshooting común

### Error: "Module not found"

**Causa:** Falta algún archivo en la estructura
**Solución:**
```bash
# Verificar estructura:
ls -la api/
# Debe mostrar process-xlf.js y generate-context.js
```

### Error: "CLAUDE_API_KEY not configured"

**Causa:** Variable de entorno no configurada
**Solución:**
1. Render dashboard → tu servicio → Environment
2. Verificar que CLAUDE_API_KEY está configurado
3. Restart service si es necesario

### Error: "Port already in use"

**Causa:** Conflicto de puertos en desarrollo local
**Solución:**
```bash
# Cambiar puerto en desarrollo:
export PORT=3001
npm start
```

### App muy lenta al iniciar

**Causa:** Free tier de Render "duerme" después de inactividad
**Soluciones:**
1. Upgrade a plan Starter ($7/mes)
2. Usar servicio de "keep alive" (ping cada 14 mins)

## 📊 Diferencias vs Netlify

| Aspecto | Netlify | Render Native |
|---------|---------|---------------|
| **Arquitectura** | Functions serverless | Express server persistente |
| **Timeouts** | 30s (hobby) / 45s (pro) | 100 minutos / Sin límite |
| **URLs API** | `/.netlify/functions/` | `/api/` |
| **Escalabilidad** | Limitada por timeout | Ilimitada |
| **Logs** | Función por función | Logs centralizados |
| **Cold starts** | Cada función | Solo al inicio |

## 📈 Próximos pasos

1. **Verificar funcionamiento completo**
2. **Comparar performance con Netlify**
3. **Configurar dominio custom (si aplicable)**
4. **Actualizar documentación/enlaces**
5. **Considerar desactivar Netlify cuando esté 100% seguro**

## 🆘 Soporte

Si encuentras problemas:

1. **Revisar logs en Render dashboard**
2. **Verificar que todos los archivos están en su lugar**  
3. **Comprobar variables de entorno**
4. **Comparar con la estructura esperada arriba**

---

**¡Tu XLF Translator ahora funciona nativamente en Render sin limitaciones de timeout!** 🎉
