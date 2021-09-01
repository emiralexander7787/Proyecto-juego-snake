window.addEventListener("DOMContentLoaded", function (event) {
  window.focus(); // Capturar claves 

  // Datos del juego
  let snakePositions; 
  let applePosition; // La posición de la manzana

  let startTimestamp; // La marca de tiempo de inicio de la animación
  let lastTimestamp; // La marca de tiempo anterior de la animación
  let stepsTaken; // Cuantos pasos dio la culebrita
  let score;
  let contrast;

  let inputs; // Una lista de direcciones que la culebrita aún debe seguir en orden

  let gameStarted = false;
  let hardMode = false;

  // Configuracion
  const width = 15; // Ancho de cuadrícula
  const height = 13; // Altura de cuadricula

  const speed = 200; // Milisegundos que le toma a la culebitra dar un paso 
  let fadeSpeed = 5000; // milisegundos que tarda la cuadrícula en desaparecer
  let fadeExponential = 1.024; // después de cada puntaje, la cuadrícula tardará gradualmente más en desaparecer
  const contrastIncrease = 0.5; // contraste que ganas después de cada puntaje
  const color = "green"; // Color primario


  const grid = document.querySelector(".titulo");
  for (let i = 0; i < width * height; i++) {
    const content = document.createElement("div");
    content.setAttribute("class", "contenido");
    content.setAttribute("id", i); // Solo para depuración, no utilizada

    const tile = document.createElement("div");
    tile.setAttribute("class", "title");
    tile.appendChild(content);

    grid.appendChild(tile);
  }

  const tiles = document.querySelectorAll(".titulo .title .contenido");

  const containerElement = document.querySelector(".container");
  const noteElement = document.querySelector("footer");
  const contrastElement = document.querySelector(".contraste");
  const scoreElement = document.querySelector(".score");

  // Inicializar diseño
  resetGame();

 // Restablece las variables y los diseños del juego, pero no inicia el juego (el juego comienza al presionar una tecla)
  function resetGame() {
    // Restablecer posiciones
    snakePositions = [168, 169, 170, 171];
    applePosition = 100; 

    
// Restablecer el progreso del juego
    startTimestamp = undefined;
    lastTimestamp = undefined;
    stepsTaken = -1; // Es -1 porque entonces la culebrita comenzará con un paso
    score = 0;
    contrast = 1;

    // Restablecer entradas
    inputs = [];

    // Restablecer encabezado
    contrastElement.innerText = `${Math.floor(contrast * 100)}%`;
    scoreElement.innerText = hardMode ? `H ${score}` : score;

    // Restablecer mosaicos
    for (const tile of tiles) setTile(tile);

    // Renderizar manzana
    setTile(tiles[applePosition], {
      "background-color": "red",
      "border-radius": "50%"
    });

    
    
    // Ignora la última parte 
    for (const i of snakePositions.slice(1)) {
      const snakePart = tiles[i];
      snakePart.style.backgroundColor = color;

      // Configurar direcciones de transición para la cabeza y la cola
      if (i == snakePositions[snakePositions.length - 1])
        snakePart.style.left = 0;
      if (i == snakePositions[0]) snakePart.style.right = 0;
    }
  }

  // Manejar las entradas del usuario 
  window.addEventListener("keydown", function (event) {
    // Si no se presionó una tecla de flecha, espacio o H, regrese
    if (
      ![
        "ArrowLeft",
        "ArrowUp",
        "ArrowRight",
        "ArrowDown",
        " ",
        "H",
        "h",
        "E",
        "e"
      ].includes(event.key)
    )
      return;

    // Si se presionó una tecla de flecha, primero evite el valor predeterminado
    event.preventDefault();

    // Si se presionó el espacio reinicia el juego
    if (event.key == " ") {
      resetGame();
      startGame();
      return;
    }

    
// Establecer modo difícil
    if (event.key == "H" || event.key == "h") {
      hardMode = true;
      fadeSpeed = 4000;
      fadeExponential = 1.025;
      noteElement.innerHTML = `Modo dificil. Pulsa espacio para iniciar el juego.!`;
      noteElement.style.opacity = 1;
      resetGame();
      return;
    }

    // Establecer el modo fácil
    if (event.key == "E" || event.key == "e") {
      hardMode = false;
      fadeSpeed = 5000;
      fadeExponential = 1.024;
      noteElement.innerHTML = `Modo facil. Pulsa espacio para iniciar el juego.!`;
      noteElement.style.opacity = 1;
      resetGame();
      return;
    }

    // Si se presionó una tecla de flecha, agregue la dirección a los siguientes movimientos
    // No permita agregar la misma dirección dos veces consecutivas
    // La culebrita tampoco puede dar una vuelta completa
    // También inicia el juego si aún no ha comenzado
    if (
      event.key == "ArrowLeft" &&
      inputs[inputs.length - 1] != "left" &&
      headDirection() != "right"
    ) {
      inputs.push("left");
      if (!gameStarted) startGame();
      return;
    }
    if (
      event.key == "ArrowUp" &&
      inputs[inputs.length - 1] != "up" &&
      headDirection() != "down"
    ) {
      inputs.push("up");
      if (!gameStarted) startGame();
      return;
    }
    if (
      event.key == "ArrowRight" &&
      inputs[inputs.length - 1] != "right" &&
      headDirection() != "left"
    ) {
      inputs.push("right");
      if (!gameStarted) startGame();
      return;
    }
    if (
      event.key == "ArrowDown" &&
      inputs[inputs.length - 1] != "down" &&
      headDirection() != "up"
    ) {
      inputs.push("down");
      if (!gameStarted) startGame();
      return;
    }
  });

  
// Empieza el juego
  function startGame() {
    gameStarted = true;
    noteElement.style.opacity = 0;
    window.requestAnimationFrame(main);
  }


  function main(timestamp) {
    try {
      if (startTimestamp === undefined) startTimestamp = timestamp;
      const totalElapsedTime = timestamp - startTimestamp;
      const timeElapsedSinceLastCall = timestamp - lastTimestamp;

      const stepsShouldHaveTaken = Math.floor(totalElapsedTime / speed);
      const percentageOfStep = (totalElapsedTime % speed) / speed;

      // Si la culebrita dio un paso 
      if (stepsTaken != stepsShouldHaveTaken) {
        stepAndTransition(percentageOfStep);

        
       // Si es el momento de dar un paso
        const headPosition = snakePositions[snakePositions.length - 1];
        if (headPosition == applePosition) {
         // Aumentar la puntuación

          score++;
          scoreElement.innerText = hardMode ? `H ${score}` : score;

          // Genera otra manzana
          addNewApple();

          // Incrementa el contraste 
          // No deja que el contraste supere el 1
          contrast = Math.min(1, contrast + contrastIncrease);


          console.log(`Contrast increased by ${contrastIncrease * 100}%`);
          console.log(
            "New fade speed (from 100% to 0% in milliseconds)",
            Math.pow(fadeExponential, score) * fadeSpeed
          );
        }

        stepsTaken++;
      } else {
        transition(percentageOfStep);
      }

      if (lastTimestamp) {
       // Disminuir el contraste en función del tiempo transcurrido y la puntuación actual
        // Con una puntuación más alta, el contraste disminuye más lentamente
        const contrastDecrease =
          timeElapsedSinceLastCall /
          (Math.pow(fadeExponential, score) * fadeSpeed);
        // No deja que el contraste caiga por debajo de cero
        contrast = Math.max(0, contrast - contrastDecrease);
      }

      contrastElement.innerText = `${Math.floor(contrast * 100)}%`;
      containerElement.style.opacity = contrast;

      window.requestAnimationFrame(main);
    } catch (error) {
      // Escribe una nota sobre reiniciar el juego y establecer la dificultad
      const pressSpaceToStart = "Pulsa espacio para reiniciar el juego.";
      const changeMode = hardMode
        ? "¿Listo para el modo facil? Presione la letra E."
        : "¿Listo para el modo dificil? Presione la letra H.";
      const followMe =
      '';
      noteElement.innerHTML = `${error.message}. ${pressSpaceToStart} <div>${changeMode}</div> ${followMe}`;
      noteElement.style.opacity = 1;
      containerElement.style.opacity = 1;
    }

    lastTimestamp = timestamp;
  }

  
  function stepAndTransition(percentageOfStep) {
    // Calcula la siguiente posición y la agréga
    const newHeadPosition = getNextPosition();
    console.log(`Serpiente entrando en el azulejo ${newHeadPosition}`);
    snakePositions.push(newHeadPosition);

   
    const previousTail = tiles[snakePositions[0]];
    setTile(previousTail);

    if (newHeadPosition != applePosition) {
  
      snakePositions.shift();

      
      const tail = tiles[snakePositions[0]];
      const tailDi = tailDirection();
      

      const tailValue = `${100 - percentageOfStep * 100}%`;

      if (tailDi == "right")
        setTile(tail, {
          left: 0,
          width: tailValue,
          "background-color": color
        });

      if (tailDi == "left")
        setTile(tail, {
          right: 0,
          width: tailValue,
          "background-color": color
        });

      if (tailDi == "down")
        setTile(tail, {
          top: 0,
          height: tailValue,
          "background-color": color
        });

      if (tailDi == "up")
        setTile(tail, {
          bottom: 0,
          height: tailValue,
          "background-color": color
        });
    }

    
// Establecer el encabezado anterior a tamaño completo
    const previousHead = tiles[snakePositions[snakePositions.length - 2]];
    setTile(previousHead, { "background-color": color });

    const head = tiles[newHeadPosition];
    const headDi = headDirection();
    const headValue = `${percentageOfStep * 100}%`;

    if (headDi == "right")
      setTile(head, {
        left: 0, // Deslizar desde la izquierda
        width: headValue,
        "background-color": color,
        "border-radius": "50%"
      });

    if (headDi == "left")
      setTile(head, {
        right: 0, // Deslizar desde la derecha
        width: headValue,
        "background-color": color,
        "border-radius": "50%"
      });

    if (headDi == "down")
      setTile(head, {
        top: 0, // Deslizar desde arriba
        height: headValue,
        "background-color": color,
        "border-radius": "50%"
      });

    if (headDi == "up")
      setTile(head, {
        bottom: 0, // Deslizar desde abajo
        height: headValue,
        "background-color": color,
        "border-radius": "50%"
      });
  }

  function transition(percentageOfStep) {
    // Cabeza de transición
    const head = tiles[snakePositions[snakePositions.length - 1]];
    const headDi = headDirection();
    const headValue = `${percentageOfStep * 100}%`;
    if (headDi == "right" || headDi == "left") head.style.width = headValue;
    if (headDi == "down" || headDi == "up") head.style.height = headValue;

    // Cola de transición
    const tail = tiles[snakePositions[0]];
    const tailDi = tailDirection();
    const tailValue = `${100 - percentageOfStep * 100}%`;
    if (tailDi == "right" || tailDi == "left") tail.style.width = tailValue;
    if (tailDi == "down" || tailDi == "up") tail.style.height = tailValue;
  }


  function getNextPosition() {
    const headPosition = snakePositions[snakePositions.length - 1];
    const snakeDirection = inputs.shift() || headDirection();
    switch (snakeDirection) {
      case "right": {
        const nextPosition = headPosition + 1;
        if (nextPosition % width == 0) throw Error("La culebrita golpeó la pared");
        

        if (snakePositions.slice(1).includes(nextPosition))
          throw Error("La culebrita se mordió a sí misma");
        return nextPosition;
      }
      case "left": {
        const nextPosition = headPosition - 1;
        if (nextPosition % width == width - 1 || nextPosition < 0)
          throw Error("La culebrita golpeó la pared");

        if (snakePositions.slice(1).includes(nextPosition))
          throw Error("La culebrita se mordió a sí misma");
        return nextPosition;
      }
      case "down": {
        const nextPosition = headPosition + width;
        if (nextPosition > width * height - 1)
          throw Error("La culebrita golpeó la pared");
        

        if (snakePositions.slice(1).includes(nextPosition))
          throw Error("La culebrita se mordió a sí misma");
        return nextPosition;
      }
      case "up": {
        const nextPosition = headPosition - width;
        if (nextPosition < 0) throw Error("La culebrita golpeó la pared");

        if (snakePositions.slice(1).includes(nextPosition))
          throw Error("La culebrita se mordió a sí misma");
        return nextPosition;
      }
    }
  }

  function headDirection() {
    const head = snakePositions[snakePositions.length - 1];
    const neck = snakePositions[snakePositions.length - 2];
    return getDirection(head, neck);
  }

  function tailDirection() {
    const tail1 = snakePositions[0];
    const tail2 = snakePositions[1];
    return getDirection(tail1, tail2);
  }

  function getDirection(first, second) {
    if (first - 1 == second) return "right";
    if (first + 1 == second) return "left";
    if (first - width == second) return "down";
    if (first + width == second) return "up";
    throw Error("Los dos mosaicos no están conectados");
  }


  function addNewApple() {

    let newPosition;
    do {
      newPosition = Math.floor(Math.random() * width * height);
    } while (snakePositions.includes(newPosition));

    // Establecer nueva manzana
    setTile(tiles[newPosition], {
      "background-color": "red",
      "border-radius": "50%"
    });


    applePosition = newPosition;
  }

  

  function setTile(element, overrides = {}) {
    const defaults = {
    };
    const cssProperties = { ...defaults, ...overrides };
    element.style.cssText = Object.entries(cssProperties)
      .map(([key, value]) => `${key}: ${value};`)
      .join(" ");
  }
});
