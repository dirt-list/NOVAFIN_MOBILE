# Manual de Instalación - NovaFin AI Mobile

## Requisitos del Sistema

### Hardware Mínimo
- **Procesador:** 1.5 GHz o superior
- **RAM:** 2 GB (recomendado: 4 GB)
- **Almacenamiento:** 100 MB libres para instalación
- **Pantalla:** 720x1280 o superior

### Software Requerido
- **Sistema Operativo:** Android 8.0 (API 26) o superior
- **Permisos:** Orígenes desconocidos habilitados para instalar APK

---

## Instalación en Android

### Opción 1: Instalación Directa (Recomendada)

#### 1. Transferir la APK

**Opción A: Cable USB**
1. Conecte su dispositivo Android al computador
2. Copie `NovaFin-Debug.apk` a la memoria interna del dispositivo
3. Desconecte el dispositivo

**Opción B: Almacenamiento en la Nube**
1. Suba `NovaFin-Debug.apk` a Google Drive, Dropbox, o similar
2. Descargue el archivo desde su dispositivo Android

**Opción C: Correo Electrónico**
1. Envíe la APK como adjunto a su propio correo
2. Abra el correo en su dispositivo y descargue el adjunto

#### 2. Habilitar Orígenes Desconocidos

1. Vaya a **Ajustes** → **Seguridad** (o **Privacidad**)
2. Busque **Orígenes desconocidos** o **Instalar aplicaciones desconocidas**
3. Habilite la opción para el explorador de archivos que usará

**Nota:** En Android 8+, se solicita permiso por aplicación. Si es la primera vez que instala una APK, se le pedirá automáticamente.

#### 3. Instalar la APK

1. Abra el explorador de archivos
2. Navegue hasta donde guardó `NovaFin-Debug.apk`
3. Toque el archivo
4. Si aparece una advertencia de seguridad, toque "Continuar" o "Instalar de todos modos"
5. Toque "Instalar"
6. Espere a que termine la instalación
7. Toque "Abrir" para iniciar la app

### Opción 2: ADB (Desarrolladores)

#### Requisitos
- Android SDK Platform Tools instalado
- Depuración USB habilitada en el dispositivo
- Cable USB conectado

#### Pasos

```bash
# 1. Verificar conexión
adb devices

# 2. Instalar la APK
adb install NovaFin-Debug.apk

# 3. Iniciar la app
adb shell am start -n com.novafin.ai/.MainActivity
```

---

## Configuración Inicial

### Primer Inicio

1. Al abrir la app, aparecerá la pantalla de configuración
2. Ingrese una clave de acceso (mínimo 4 caracteres)
3. Confirme la clave
4. Toque "Iniciar"
5. La app mostrará el Dashboard

### Sin Clave de Acceso

Si prefiere no configurar una clave:
1. Toque "Omitir (no recomendado)"
2. La app iniciará sin protección
3. Puede configurar una clave después desde Configuración (⚙️)

---

## Permisos Requeridos

### Permisos Automáticos

| Permiso | Uso |
|---------|-----|
| **Almacenamiento** | Guardar base de datos y archivos |
| **Notificaciones** | Recordatorios de pagos y resúmenes |
| **Internet** | No requerido (funciona offline) |

### Permisos Opcionales

| Permiso | Uso |
|---------|-----|
| **Cámara** | No utilizado actualmente |
| **Ubicación** | No utilizado actualmente |
| **Contactos** | No utilizado actualmente |

---

## Almacenamiento de Datos

### Ubicación

Los datos se almacenan en:
```
/data/data/com.novafin.ai/databases/novafin_db
```

### Tamaño

- **Base de datos vacía:** ~20 KB
- **Con datos de uso normal:** 1-10 MB
- **Con muchos registros:** 10-50 MB

### Backup

La app permite exportar e importar backups desde Configuración (⚙️).

---

## Desinstalación

### Desinstalar la App

1. Vaya a **Ajustes** → **Aplicaciones** → **NovaFin AI**
2. Toque **Desinstalar**
3. Confirme la desinstalación

### Conservar Datos

Los datos de la app se eliminan al desinstalar. Asegúrese de hacer un backup antes de desinstalar si desea conservar sus datos.

---

## Actualización

### Actualizar la APK

1. Descargue la nueva versión de la APK
2. Toque el archivo para instalarlo
3. Android detectará que la app ya está instalada
4. Toque "Actualizar" o "Instalar"
5. Los datos se conservan

### Cambios entre Versiones

Consulte el archivo CHANGELOG.md en el repositorio para ver los cambios entre versiones.

---

## Solución de Problemas de Instalación

### "No se puede instalar la APK"

- **Causa:** Orígenes desconocidos no habilitados
- **Solución:** Habilite Orígenes desconocidos en Ajustes → Seguridad

### "No hay suficiente espacio"

- **Causa:** Almacenamiento insuficiente
- **Solución:** Libere espacio eliminando archivos o apps innecesarias

### "La APK está dañada"

- **Causa:** El archivo se descargó incompleto
- **Solución:** Vuelva a descargar la APK

### "Se requiere Android 8.0 o superior"

- **Causa:** Versión de Android incompatible
- **Solución:** Actualice su dispositivo a Android 8.0 o superior, o use un dispositivo compatible

---

## Requisitos de Desarrollo

Si desea compilar la APK desde el código fuente:

### Software Necesario

| Componente | Versión Mínima |
|------------|----------------|
| **Node.js** | 18.0 |
| **npm** | 9.0 |
| **Java JDK** | 21.0 |
| **Android SDK** | API 36 |
| **Gradle** | 8.14.3 (descargado automáticamente) |

### Compilar la APK

```bash
# 1. Clonar repositorio
git clone https://github.com/dirt-list/ASISTENTE_DE_FINANZAS_PERSONALES.git
cd ASISTENTE_DE_FINANZAS_PERSONALES/novafin-mobile

# 2. Instalar dependencias
npm install

# 3. Compilar web assets
npm run build

# 4. Sincronizar con Capacitor
npx cap sync

# 5. Abrir en Android Studio (opcional)
npx cap open android

# 6. Compilar APK (sin Android Studio)
cd android
./gradlew assembleDebug

# 7. APK generada en:
# android/app/build/outputs/apk/debug/app-debug.apk
```

---

## Notas Importantes

1. **Datos locales:** Toda la información se almacena en su dispositivo. No hay sincronización con la nube.

2. **Sin actualizaciones automáticas:** Las actualizaciones se realizan manualmente descargando la nueva APK.

3. **Compatibilidad:** La app está diseñada para Android 8.0+ (API 26+).

4. **Debug vs Release:** La APK de debug incluye herramientas de desarrollo. Para uso final, se recomienda una build de release con firma.

5. **Tamaño:** La APK tiene aproximadamente 26 MB. Se recomienda una conexión WiFi para la primera descarga.
