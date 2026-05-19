# 📱 MisTareas — Ionic + Angular Todo App

Aplicación móvil de gestión de tareas construida con **Ionic 7** y **Angular 17**, con soporte para Android e iOS vía **Cordova**.

---

## ✨ Características

- ✅ **Agregar, editar y eliminar tareas**
- ✅ **Marcar tareas como completadas** (con animación)
- ✅ **Persistencia con localStorage** (sin backend)
- ✅ **Categorías personalizables** (crear, editar, eliminar)
- ✅ **Asignar categorías a cada tarea**
- ✅ **Filtrar por estado** (todas, activas, completadas)
- ✅ **Filtrar por categoría**
- ✅ **Búsqueda en tiempo real**
- ✅ **Prioridades** (Alta, Media, Baja)
- ✅ **Gestos deslizables** (swipe para editar/eliminar)
- ✅ **Modo oscuro automático**
- ✅ **Optimizado para grandes listas** (Angular Signals + ChangeDetection.OnPush)

---

## 🏗️ Arquitectura y Optimizaciones de Rendimiento

### Signals de Angular 17
- Los servicios usan `signal()` y `computed()` para reactividad granular
- Solo se re-renderiza lo que cambia
- `ChangeDetectionStrategy.OnPush` en todos los componentes

### Carga Inicial
- **Lazy loading** de páginas con `loadChildren()`
- **PreloadAllModules** para pre-cargar rutas en segundo plano
- Producción con `enableProdMode()` y tree-shaking de Angular CLI

### Manejo de Grandes Listas
- `trackBy` en todos los `@for` para evitar re-renderizado innecesario
- Filtrado y ordenación con `computed()` (solo recalcula cuando cambia la fuente)
- Escrituras a `localStorage` son asíncronas y sin bloquear la UI

### Minimización de Memoria
- Un único signal fuente de verdad por servicio
- Los filtros son computados, no copias separadas en memoria
- `OnPush` evita detección de cambios en árbol completo

---

## 🚀 Instalación y Configuración

### Prerrequisitos

```bash
# Node.js 18+ y npm
node --version   # ≥ 18.0.0
npm --version    # ≥ 9.0.0

# Ionic CLI
npm install -g @ionic/cli

# Angular CLI
npm install -g @angular/cli

# Cordova (para builds nativos)
npm install -g cordova
```

### Instalar dependencias

```bash
git clone <repo-url>
cd ionic-app
npm install
```

---

## 💻 Desarrollo Web

```bash
# Servidor de desarrollo local
ionic serve
# o
npm start

# Abre en: http://localhost:8100
```

---

## 🤖 Android

### Prerrequisitos Android

1. **Java JDK 17+**
   ```bash
   # Ubuntu/Debian
   sudo apt install openjdk-17-jdk
   # macOS (Homebrew)
   brew install openjdk@17
   ```

2. **Android Studio** — [Descargar aquí](https://developer.android.com/studio)
   - Instalar SDK Android API 33+
   - Configurar variable de entorno:
     ```bash
     # En ~/.bashrc o ~/.zshrc
     export ANDROID_HOME=$HOME/Android/Sdk
     export PATH=$PATH:$ANDROID_HOME/emulator
     export PATH=$PATH:$ANDROID_HOME/tools
     export PATH=$PATH:$ANDROID_HOME/platform-tools
     ```

3. **Gradle** (incluido con Android Studio)

### Agregar plataforma Android

```bash
ionic cordova platform add android
```

### Build de producción (APK)

```bash
# Build del proyecto Angular primero
ionic build --prod

# Compilar APK
ionic cordova build android --prod

# El APK estará en:
# platforms/android/app/build/outputs/apk/debug/app-debug.apk
```

### Build release (AAB para Google Play)

```bash
ionic cordova build android --prod --release -- -- --packageType=bundle
```

### Ejecutar en emulador Android

```bash
# Listar emuladores disponibles
emulator -list-avds

# Ejecutar emulador (crear uno en Android Studio primero)
ionic cordova emulate android --livereload

# Con HotReload para desarrollo
ionic cordova run android --livereload --external
```

### Ejecutar en dispositivo físico Android

```bash
# Conectar dispositivo USB con depuración USB activada
adb devices

# Ejecutar en el dispositivo
ionic cordova run android --device
```

---

## 🍎 iOS

> **⚠️ Requiere macOS y Xcode**

### Prerrequisitos iOS

1. **macOS 12+** con **Xcode 14+**
   - Instalar desde Mac App Store
   - Aceptar licencia: `sudo xcodebuild -license accept`

2. **CocoaPods**
   ```bash
   sudo gem install cocoapods
   # o con Homebrew
   brew install cocoapods
   ```

3. **Cuenta de Apple Developer** (para dispositivos físicos)
   - Cuenta gratuita: solo simulador
   - Cuenta de pago ($99/año): dispositivos reales y App Store

### Agregar plataforma iOS

```bash
ionic cordova platform add ios
```

### Build para simulador

```bash
# Build del proyecto
ionic build --prod

# Compilar para iOS
ionic cordova build ios --prod

# El .app estará en:
# platforms/ios/build/emulator/MisTareas.app
```

### Ejecutar en simulador iOS

```bash
# Listar simuladores
xcrun simctl list devices

# Ejecutar en simulador
ionic cordova emulate ios --livereload

# Con simulador específico
ionic cordova emulate ios --target="iPhone 15 Pro, 17.0"
```

### Ejecutar en dispositivo iOS físico

```bash
# Conectar iPhone/iPad por USB
# Confiar en la computadora desde el dispositivo

ionic cordova run ios --device
```

### Abrir en Xcode (para signing y distribución)

```bash
open platforms/ios/MisTareas.xcworkspace
```

En Xcode:
1. Seleccionar target `MisTareas`
2. En "Signing & Capabilities" → elegir tu Team
3. Cambiar Bundle Identifier si es necesario
4. `Product → Run` (⌘R)

---

## 📦 Estructura del Proyecto

```
ionic-todo-app/
├── src/
│   ├── app/
│   │   ├── models/
│   │   │   └── index.ts          # Interfaces Task y Category
│   │   ├── services/
│   │   │   ├── storage.service.ts    # Wrapper de localStorage
│   │   │   ├── task.service.ts       # Gestión de tareas (Signals)
│   │   │   └── category.service.ts   # Gestión de categorías
│   │   ├── pages/
│   │   │   ├── home/             # Lista de tareas principal
│   │   │   └── categories/       # Gestión de categorías
│   │   ├── app.module.ts
│   │   ├── app-routing.module.ts
│   │   └── app.component.ts
│   ├── theme/
│   │   └── variables.scss        # Tokens de diseño y modo oscuro
│   ├── environments/
│   │   ├── environment.ts
│   │   └── environment.prod.ts
│   ├── global.scss
│   ├── index.html
│   └── main.ts
├── config.xml                    # Configuración Cordova
├── ionic.config.json
├── angular.json
├── package.json
└── tsconfig.json
```

---

## 🔧 Scripts disponibles

| Comando | Descripción |
|---------|-------------|
| `npm start` | Servidor de desarrollo web |
| `npm run build` | Build de desarrollo |
| `npm run build:prod` | Build de producción optimizado |
| `npm run android` | Build APK Android |
| `npm run android:dev` | Ejecutar en Android con HotReload |
| `npm run ios` | Build iOS |
| `npm run ios:dev` | Ejecutar en iOS con HotReload |

---

## 🐛 Solución de Problemas Comunes

### Android: `ANDROID_HOME not set`
```bash
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

### iOS: `No profiles for 'com.mistareas.app'`
1. Abrir Xcode → `platforms/ios/MisTareas.xcworkspace`
2. Signing & Capabilities → seleccionar tu equipo
3. Cambiar Bundle ID a algo único: `com.tudominio.mistareas`

### `cordova: command not found`
```bash
npm install -g cordova
```

### Build falla con Java
```bash
# Verificar versión
java -version  # debe ser 17+
# Establecer JAVA_HOME
export JAVA_HOME=$(/usr/libexec/java_home -v 17)  # macOS
```

### Puerto 8100 ocupado
```bash
ionic serve --port 8200
```

---

