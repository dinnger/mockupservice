# Documentación Técnica de la Función `onCreate`

## Descripción
La función `onCreate` se inicia al momento ser creado el nodo o al momento de haberse cargado el flujo y entrar a las propiedades del nodo.

## Parámetros


### `context`
- Tipo: Objeto
- Descripción: El parámetro `context` contiene información y utilidades que son útiles en el contexto de la aplicación. Incluye las siguientes propiedades:

### `files`
- Tipo: Objeto
- Descripción: Permite acceder al sistema de archivos del flujo. Incluye las siguientes propiedades.

#### `files.get`
- Tipo: Función
- Descripción: La función `get` se utiliza para obtener un archivo en concreto almacenado en el flujo.

Esta conformado por:
- path: Ubicación interna del flujo
- fileName: Nombre del archivo.
- Options: Sin opciones disponibles.

Ejemplo de uso:
```javascript
files.get({path,fileName,options})
```

#### `files.create`
- Tipo: Función
- Descripción: La función `create` se utiliza para guardar un archivo en el almacenamiento interno del flujo.

Esta conformado por:
- path: Ubicación interna del flujo
- fileName: Nombre del archivo.
- file: Archivo a cargar.
- Options:
  - unzip: 
    - Tipo: (true | false)
    - Descripción: Permite indicar si se descomprimirá el archivo.

Ejemplo de uso:
```javascript
files.create({path,file,options})
```

#### `files.remove`
- Tipo: Función
- Descripción: La función `remove` se utiliza para eliminar un directorio del flujo.

Esta conformado por:
- path: Ubicación interna del flujo
- fileName: Nombre del archivo.
- Options: Sin opciones disponibles.

Ejemplo de uso:
```javascript
files.remove({path,fileName,options})
```