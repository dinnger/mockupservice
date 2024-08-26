## Reglas de procesamiento

1. Busca todas las coincidencias de texto entre llaves dobles (`{{...}}`) en las propiedades y las reemplaza por sus valores correspondientes.
2. Las cadenas entre llaves dobles son analizadas y divididas en segmentos.
3. El primer segmento determina la fuente de datos: variable (`VAR`), entrada (`INPUT`), o un nombre de nodo.
4. Los segmentos siguientes son utilizados para acceder a las propiedades anidadas del objeto fuente.
5. Si una propiedad no existe en el objeto fuente, se evalúa como cadena vacía.
6. Se decodifican las variables de tipo `VAR`.
7. Los valores se reemplazan en el objeto de propiedades original.
8. Existen funciones que se pueden utilizar al final de la búsqueda como la propiedad length

## Ejemplo de uso

Supongamos el siguiente objeto de propiedades:

```json
{
  "name": "John",
  "age": "{{VAR.userAge}}",
  "address": "{{INPUT.address.street}}",
  "city": "{{INPUT.address.city}}",
  "company": "{{transformación.data.company.name}}",
  "friends": "{{transformación.data.friends.length}}"
}
```
Descripción
``` json
"name" es una propiedad directa y no se modifica.
"age" se reemplaza por el valor de VAR.userAge. (Variables del flujo)
"address" y "city" se reemplazan por los valores de INPUT.address.street y INPUT.address.city. (Input toma el valor del nodo origen)
"company" se reemplaza por el valor de transformación.data.company.name.
"friends" se reemplaza por la longitud del arreglo transformación.data.friends.
```
## Respuesta

```json
{
  "name": "John",
  "age": 30, // Suponiendo que VAR.userAge es igual a 30
  "address": "123 Main St",
  "city": "Example City",
  "company": "Example Company",
  "friends": 5 // Suponiendo que nodeC.friends es un arreglo de longitud 5
}
```