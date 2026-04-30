Universidad del Valle de Guatemala  
Facultad de Ingeniería  
Departamento de Ciencias de la Computación  
CC3089 Base de Datos 2  
Semestre I 2026  
- 1/6 -

# Proyecto No. 2

# Neo4j - PAREJAS o TRÍOS

## I. Modalidad y fecha de entrega

a) El proyecto debe realizarse en parejas o tríos. Deberán asignarse a los grupos en canvas.

b) Debe ser enviado antes de la fecha límite de entrega: Martes 5 de mayo a las 18:59 horas a más tardar.

c) El orden de los grupos a presentar será sorteado aleatoriamente previo a la semana de entrega. Las presentaciones de proyecto se basarán en la dinámica de show and tell al catedrático durante el período de clase, cada grupo deberá presentar las funcionalidades (requeridas y extras) de su proyecto.

d) Algunos grupos podrán escoger entregar hasta el jueves 7 de mayo antes de las 17:20 horas, pero deberán cambiar de lugar con otro grupo que presentaba ese día (en caso que originalmente presentaran el martes). Ambos grupos deberán acordar este movimiento. Si decide entregar hasta el jueves, no podrá obtener más del 80% de su nota.

e) Consultar la rúbrica de evaluación.

## II. Objetivo y descripción de la actividad

El objetivo de este proyecto es desarrollar un servicio web que actúe como el backend funcional de una aplicación web que facilite a los usuarios la gestión y almacenamiento de datos estructurados como grafos que residan en Neo4j (se recomienda utilizar AuraDB). Este servicio simulará uno de los casos de uso de Neo4j a elección por el grupo, que deberá ser aprobado por el docente del curso. La idea es que modele, maneje y refleje una cantidad robusta de información de múltiples índoles. Se espera que dicha aplicación desarrollada tenga implementadas todas las llamadas del API que utilice como parte de una aplicación funcional completa y robusta. No se tomarán en cuenta llamadas y/o consultas de APIs que no estén implementadas dentro de una aplicación funcional interactiva y orientada al usuario.

La aplicación abordará aspectos clave, como el modelado de un grafo con múltiples nodos y relaciones, configuración de nodos con distintas y múltiples etiquetas, configuración de relaciones de diferentes tipos, definición de propiedades para nodos y etiquetas, operaciones CRUD sobre el grafo, manipulación de los diferentes tipos de datos en las propiedades (texto, numérico, listas, fechas, booleanos, etc). La implementación de la base de datos deberá ser fiel al diseño que se modele del caso de uso.

Casos de uso a implementar (deberá existir al menos 2 grupos representando cada caso de uso)

### Motor de recomendación

Los estudiantes pueden utilizar Neo4j para crear un sistema de recomendación de películas, series y/o productos (e-commerce). Por ejemplo, podrían diseñar la estructura de nodos y relaciones para las películas, los actores, los géneros y otros atributos, y luego utilizar la tecnología de recomendación de Neo4j para crear un sistema que sugiera películas a los usuarios en función de sus gustos y preferencias.

### Red social

El objetivo es que puedan crear una red social utilizando Neo4j. Por ejemplo, podrían diseñar la estructura de nodos y relaciones para los usuarios, publicaciones, comentarios, gustos y otros elementos de una red social, y luego implementarla utilizando la API de Neo4j.

---

Universidad del Valle de Guatemala  
Facultad de Ingeniería  
Departamento de Ciencias de la Computación  
CC3089 Base de Datos 2  
Semestre I 2026  
- 2/6 -

### Cadena de suministros

El objetivo es que puedan diseñar e implementar un modelo de grafo en Neo4j para la gestión de cadenas de suministro. Por ejemplo, podrían incluir información de proveedores, productos, órdenes de compra, inventarios y rutas de transporte, y permitir la optimización de la cadena de suministro para mejorar la eficiencia y reducir los costos.

### Detección de fraude

El objetivo de este es diseñar e implementar un modelo de grafo en Neo4j para detectar posibles fraudes en transacciones bancarias. Por ejemplo, el modelo podría incluir información de los clientes, cuentas, transacciones y patrones de comportamiento, y permitir la identificación de patrones sospechosos y relaciones inusuales que puedan indicar actividades fraudulentas.

### Instrucciones generales y observaciones

Se debe desarrollar una aplicación que permita gestionar data para almacenarla/consumirla en Neo4j/AuraDB. Se recomienda el uso de AuraDB para incentivar un ambiente colaborativo dentro de su entorno, pero podrán tomar la decisión como grupo de utilizar. Su proyecto, deberá incluir y manejar los siguientes aspectos:

- Definir mínimo 5 diferentes etiquetas para nodos
- Definir mínimo 5 diferentes propiedades para cada etiqueta de nodos
- Gestión de nodos con 1 o más etiquetas
- Definir mínimo 10 tipos de relaciones entre nodos
- Definir mínimo 3 diferentes propiedades para cada tipo de relación
- Utilizar propiedades con los siguientes tipos de datos, como mínimo:
  - Texto
  - Número
  - Booleano
  - Listas
  - Fechas
- Generación y uso de un mínimo de 5000 nodos
- Carga de datos a partir de archivo csv
- Operaciones CRUD de nodos y relaciones
- Filtrado de datos
- Agregaciones de datos
- Asegurarse que la implementación genere un grafo conexo
- No hay una cantidad de relaciones definida puesto que dependerá de la implementación que cada grupo defina, pero es importante que el grafo sea conexo.

Se recomienda consultar la rúbrica de evaluación para mayor detalle. Temas como la estética y todo lo relacionado con el Frontend de su aplicación no será un criterio a tomar en cuenta para la calificación. Lo más importante es la interacción que hay con los datos que maneja Neo4j y cómo desde el frontend se pueden manipular estos datos.

---

Universidad del Valle de Guatemala  
Facultad de Ingeniería  
Departamento de Ciencias de la Computación  
CC3089 Base de Datos 2  
Semestre I 2026  
- 3/6 -

## ETAPA 01 - Propuesta de Proyecto

Una vez definidos los grupos y asignados en canvas, deberán pensar en el caso de uso a modelar e implementar sobre Neo4j. En este caso de uso deberá de utilizar los suficientes nodos y relaciones para representar adecuadamente el caso seleccionado, y deberá argumentar cómo piensa implementar los aspectos a evaluar en el proyecto. Deberá contar con la aprobación de su catedrático a más tardar el Jueves 09 de abril. Deben de existir al menos dos grupos por caso de uso.

## ETAPA 02 - Diseño del Grafo

Con el caso de uso seleccionado, deberá realizar una pre entrega. La pre-entrega consiste en poder entregar un diseño del grafo que estará implementando como las bases fundamentales de su proyecto. Este diseño deberá ser aprobado por su catedrático a más tardar el día Martes 21 de abril.

## ETAPA 03 - Elaboración del proyecto

Con la propuesta aprobada, se encargará de implementar la solución en el lenguaje de programación a su preferencia. Se recomienda que utilice una instancia en Aura para fomentar y facilitar el trabajo colaborativo. Lo más importante será cómo implementen el modelo del grafo con los aspectos a evaluar de la rúbrica.

## ETAPA 04 - Presentación

Presentará los resultados de su proyecto y el funcionamiento del mismo durante los períodos de clase de la semana del 05 al 08 de Mayo. La forma de evaluación será empezar explicando su proyecto y caso de uso, e ir mostrando cómo su solución cumple con cada uno de los aspectos a evaluar.

## III. Temas a reforzar

- Funcionamiento general de Neo4j y sus componentes
- Modelado de grafo de datos
- Operaciones CRUD
- Consultas y agregaciones
- Uso de múltiples tipos de datos
- Usabilidad de una base de datos orientada a grafos

## IV. Entregables

- Código fuente desarrollado (url de repositorio, con historial de cambios). El URL deberá de ser público.
- Video general del funcionamiento de su aplicación, que no dure más de 10 minutos.
- Documento escrito que incluya un diagrama del modelo de datos desarrollado y la explicación de este. Deberá incluir la definición de las diferentes etiquetas de nodos y tipos de relaciones, con sus respectivas propiedades y tipos de datos.

## V. Rúbrica de Evaluación

| Categoría | Criterio | Puntaje |
|---|---|---:|
| Modelado de datos | Implementación de caso de uso adecuado<br>Motor de recomendación, red social, cadena de suministro o detección de fraude | 5 |

---

Universidad del Valle de Guatemala  
Facultad de Ingeniería  
Departamento de Ciencias de la Computación  
CC3089 Base de Datos 2  
Semestre I 2026  
- 4/6 -

| Categoría | Criterio | Puntaje |
|---|---|---:|
| Modelado de datos | Definición de nodos con labels y propiedades<br>- Se definieron por lo menos 5 labels distintas<br>- Para cada label distinta, se definió por lo menos 5 propiedades | 5 |
| Modelado de datos | Definición de tipos de relaciones con propiedades<br>- Se definieron por lo menos 10 tipos de relaciones distintos<br>- Para cada tipo distinto de relación, se definió por lo menos 3 propiedades | 5 |
| Modelado de datos | Implementación de todos los tipos de datos<br>- String<br>- Float<br>- Integer<br>- Boolean<br>- List<br>- Date | 5 |
| Set de datos | Carga de data (csv)<br>Se puede realizar la carga de datos nuevos por medio de un archivo CSV, con el cual se crean nodos y relaciones con sus distintas propiedades | 5 |
| Set de datos | Datos previamente cargados en BD<br>Al momento de presentar el proyecto se cuenta con nodos previamente cargados y relacionados entre sí | 2 |
| Set de datos | Cumple con cantidad de nodos estipulada<br>Al momento de presentar el proyecto se cuenta con la cantidad mínima establecida de nodos (5000 nodos distintos) | 2 |
| Set de datos | Grafo conexo<br>Al momento de presentar el proyecto, el grafo modelado muestra todos los nodos conectados. NOTA: En caso de no contar con un grafo conexo, no se podrán asignar puntos para el hito de Set de Datos | 1 |
| Aplicación funcional: | Creación de nodos con 1 label<br>Operación CREATE que cree un nuevo nodo en la base de datos, el cual solamente tenga asignada una label | 5 |
| Aplicación funcional: | Creación de nodos con 2+ labels<br>Operación CREATE/MERGE que cree un nuevo nodo en la base de datos, el cual tenga 2 o más labels asignadas | 5 |
| Aplicación funcional: | Creación de nodos con propiedades<br>Operación CREATE/MERGE que cree un nuevo nodo en la base de datos, el cual haga la creación con por lo menos 5 propiedades configuradas | 5 |
| Aplicación funcional: | Visualización de Nodos<br>- Operación que realice consultas de nodos con base a determinados filtros y se muestre la información de las propiedades de estos | 5 |

---

Universidad del Valle de Guatemala  
Facultad de Ingeniería  
Departamento de Ciencias de la Computación  
CC3089 Base de Datos 2  
Semestre I 2026  
- 5/6 -

| Categoría | Criterio | Puntaje |
|---|---|---:|
| Aplicación funcional: | Visualización de Nodos<br>- Consultar 1 nodo<br>- Consultar muchos nodos<br>- Realizar consultas agregadas de datos |  |
| Aplicación funcional: | Gestión de propiedades en nodos<br>- Operación que permita agregar 1 o más propiedades a un nodo<br>- Operación que permita agregar 1 o más propiedades a múltiples nodos al mismo tiempo<br>- Operación que permita realizar la actualización de 1 o más propiedades de un nodo<br>- Operación que permita realizar la actualización de 1 o más propiedades de múltiples nodos al mismo tiempo<br>- Operación que permita eliminar 1 o más propiedades de un nodo<br>- Operación que permita eliminar 1 o más propiedades de múltiples nodos al mismo tiempo | 10 |
| Aplicación funcional: | Creación de relación con propiedades<br>- Operación CREATE que cree una relación entre 2 nodos ya existentes<br>- La operación deberá incluir el tipo de la relación y mínimo 3 propiedades | 5 |
| Aplicación funcional: | Gestión de relaciones (dirección, nodos y/o propiedades)<br>- Operación que permita agregar 1 o más propiedades a una relación<br>- Operación que permita agregar 1 o más propiedades a múltiples relaciones al mismo tiempo<br>- Operación que permita realizar la actualización de 1 o más propiedades de la relación<br>- Operación que permita realizar la actualización de 1 o más propiedades de múltiples relaciones al mismo tiempo<br>- Operación que permita eliminar 1 o más propiedades de una relación<br>- Operación que permita eliminar 1 o más propiedades de múltiples relaciones al mismo tiempo | 10 |
| Aplicación funcional: | Eliminación de nodos<br>- Operación que permita eliminar 1 nodo<br>- Operación que permita eliminar múltiples nodos al mismo tiempo | 5 |
| Aplicación funcional: | Eliminación de relaciones<br>- Operación que permita eliminar 1 relación<br>- Operación que permita eliminar múltiples relaciones al mismo tiempo | 5 |
| Aplicación funcional: | Consultas Cypher<br>- Al momento de presentar el proyecto, el grupo de estudiantes deberá realizar entre 4-6 diferentes consultas sobre su modelo de datos<br>- Cada integrante del grupo deberá realizar 2 consultas | 15 |
| Extras | Implementación Algoritmo Data Science<br>Según el caso de uso implementado, se pueden utilizar diferentes algoritmos de data science para resolver determinadas problemáticas | 10 |

---

Universidad del Valle de Guatemala  
Facultad de Ingeniería  
Departamento de Ciencias de la Computación  
CC3089 Base de Datos 2  
Semestre I 2026  
- 6/6 -

| Categoría | Criterio | Puntaje |
|---|---|---:|
| Extras | Interfaz Gráfica (Frontend) Excepcional | 10 |

Nota: Lo marcado en amarillo hace referencia a los puntos extra. El proyecto tiene un valor total de 15 puntos netos pero será calificado sobre 100. Podrá llegar a obtener hasta 120 puntos en total.
