export const nodosProperties = {
  as400: [
    ['host', 'Host'],
    ['user', 'Usuario'],
    ['password', 'Contraseña'],
    ['timeout', 'Tiempo de Espera', 30]
  ],
  postgres: [
    ['host', 'Host'],
    ['user', 'Usuario'],
    ['password', 'Contraseña'],
    ['database', 'Base de Datos'],
    'port',
    ['timeout', 'Tiempo de Espera', 30]
  ],
  cassandra: [
    ['host', 'Host'],
    ['user', 'Usuario'],
    ['password', 'Contraseña'],
    ['dataCenter', 'Centro de Datos', ''],
    'keyspace',
    ['timeout', 'Tiempo de Espera', 30]
  ],
  mongo: [
    ['host', 'Host'],
    ['database', 'Base de Datos'],
    ['timeout', 'Tiempo de Espera', 30]
  ],
  oracle: [
    ['host', 'Host'],
    ['user', 'Usuario'],
    ['password', 'Contraseña'],
    ['database', 'Base de Datos'],
    ['timeout', 'Tiempo de Espera', 30]
  ]
}
