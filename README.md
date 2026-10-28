# Contactos Nimbus

Aplicación web de contactos desarrollada para el Laboratorio 11 de Desarrollo de Soluciones en la Nube. El mismo proyecto se puede ejecutar en una instancia EC2 con Windows Server y en otra con Debian para demostrar portabilidad y virtualización.

## Funcionalidades

- Crear, editar y eliminar contactos.
- Marcar contactos como favoritos.
- Buscar por nombre, empresa, ciudad o correo.
- Filtrar por clientes, equipo, proveedores y contactos personales.
- Ordenar por actividad, nombre o empresa.
- Persistencia local mediante un archivo JSON.
- Interfaz responsive para computadoras, tabletas y teléfonos.
- Endpoint de verificación en `/api/health`.

## Requisitos

- Node.js 18 o superior.
- npm.

## Ejecución

```bash
npm install
npm start
```

Abrir `http://localhost:3000`.

Para permitir el acceso desde la IP pública de una instancia EC2, el servidor escucha en `0.0.0.0`. En el grupo de seguridad se debe habilitar el puerto `3000` únicamente para la IP desde la que se realizará la demostración.

## Despliegue en Windows Server

1. Instalar Node.js LTS y Git.
2. Clonar el repositorio.
3. Ejecutar `npm install`.
4. Ejecutar `npm start`.
5. Abrir `http://localhost:3000` dentro de la instancia o `http://IP_PUBLICA:3000` desde el equipo autorizado.

## Despliegue en Debian

```bash
sudo apt update
sudo apt install -y nodejs npm git
git clone URL_DEL_REPOSITORIO contactos-nimbus
cd contactos-nimbus
npm install
npm start
```

## Seguridad

- RDP `3389`, SSH `22` y la aplicación `3000` deben restringirse a la IP pública del estudiante.
- No se deben incluir claves `.pem`, contraseñas ni archivos `.env` en Git.
- Las instancias deben detenerse o eliminarse al finalizar las evidencias para evitar cargos.
