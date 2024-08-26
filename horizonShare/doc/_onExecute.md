# Documentación Técnica de la Función `onExecute`

## Descripción
La función `onExecute` se inicia al momento de recibir una llamada externa de otro nodo al nodo actual.

## Parámetros

### `server`
- Tipo: Instancia de Express.js
- Descripción: El parámetro `server` permite conectarse a la instancia de Express.js para definir rutas, manejar solicitudes HTTP entrantes y realizar otras operaciones relacionadas con el servidor web.

Ejemplo de uso:
```javascript
server.get('/', (req, res) => {
  // Manejo de la solicitud HTTP en la ruta '/'
});
```

### `context`
- Tipo: Objeto
- Descripción: El parámetro `context` contiene información y utilidades que son útiles en el contexto de la aplicación. Incluye las siguientes propiedades:

#### `context.env`
- Tipo: Objeto
- Descripción: Contiene las variables de entorno del entorno de la aplicación. Puede acceder a configuraciones, secretos u otras variables de entorno relevantes aquí.

Ejemplo de uso:
```javascript
const apiKey = context.env.API_KEY
```

#### `context.logger`
- Tipo: Función
- Descripción: La función `logger` se utiliza para registrar información, errores o eventos importantes en la aplicación. Puede personalizar esta función para registrar en archivos de registro, en la consola u otros destinos.

Ejemplo de uso:
```javascript
context.logger.debug('hola mundo')
```

#### `context.ifExecute()`
- Tipo: Función
- Descripción: La función `ifExecute()` se utiliza para condicionar la ejecución de ciertas partes del código en función de condiciones específicas. Puede ayudar a controlar el flujo de ejecución de manera dinámica.

Ejemplo de uso:
```javascript
if (context.ifExecute()) {
  // Ejecutar cierto código si se no se ha iniciado el nodo previamente en esta ejecución
}
```

#### `context.getNodeByName(name)`
- Tipo: Función
- Descripción: La función `getNodeByName` permite buscar y acceder a nodos específicos en una aplicación. Puede ser útil cuando se trabaja con una arquitectura basada en nodos o flujos de trabajo.

Ejemplo de uso:
```javascript
const node = context.getNodeByName('miNodo');
```

#### `context.getNodeByType(type)`
- Tipo: Función
- Descripción: La función `getNodeByType` permite buscar y acceder a nodos que tengan un tipo específico en una aplicación. Esto puede ser útil en aplicaciones complejas con múltiples tipos de nodos.

Ejemplo de uso:
```javascript
const node = context.getNodeByType('tipoNodo');
```

### `inputData`
- Tipo: Objeto
- Descripción: El parámetro `inputData` contiene información proveniente del nodo anterior en la ejecución de la aplicación. Puede contener datos relevantes para la operación que se está realizando en la función `onExecute`.

Ejemplo de uso:
```javascript
const data = inputData
```

### `outputData`
- Tipo: Función
- Descripción: La función `outputData` se utiliza para enviar datos y resultados al siguiente nodo o paso en la ejecución de la aplicación. Permite especificar el nombre de la salida y la información que se debe pasar al siguiente nodo.

Ejemplo de uso:
```javascript
outputData('salida1', { resultado: 'Datos de salida' });
```

## Ejemplo de Uso

```javascript
async function onExecute({ server, context, inputData, outputData }) {
  // Acceder a las variables de entorno
  const apiKey = context.env.API_KEY;

  // Registrar un mensaje de registro
  context.logger('Registrando un mensaje de registro');

  // Condicionar la ejecución en función de una condición
  if (context.ifExecute(inputData.condición)) {
    // Ejecutar cierto código si se cumple la condición
  }

  // Buscar un nodo por nombre
  const node = context.getNodeByName('miNodo');

  // Enviar datos al siguiente nodo
  outputData('salida1', { resultado: 'Datos de salida' });
}
