import logo from './logo.svg';
import './App.css';
import Board from './components/Board';
import React, { useState, createContext, useEffect } from 'react';
import Header from './components/Header';

export const AppContext = createContext();


/*          *     .        *  .    *    *   . 
 .  *  move your mouse to over the stars   .
 *  .  .   change these values:   .  *
   .      * .        .          * .       */
const STAR_COLOR = "#fff";
const STAR_SIZE = 3;
const STAR_MIN_SCALE = 0.2;
const OVERFLOW_THRESHOLD = 50;
const STAR_COUNT = (window.innerWidth + window.innerHeight) / 5;

const canvas = document.querySelector("canvas"),
  context = canvas.getContext("2d");

let scale = 1, // device pixel ratio
  width,
  height;

let stars = [];

let pointerX, pointerY;

let velocity = { x: 0, y: 0, tx: 0, ty: 0, z: 0.005 };

let touchInput = false;

generate();
resize();
step();

window.onresize = resize;
canvas.onmousemove = onMouseMove;
canvas.ontouchmove = onTouchMove;
canvas.ontouchend = onMouseLeave;
document.onmouseleave = onMouseLeave;

function generate() {
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: 0,
      y: 0,
      z: STAR_MIN_SCALE + Math.random() * (1 - STAR_MIN_SCALE),
      // z: Math.random(),
    });
  }
}

function placeStar(star) {
  star.x = Math.random() * width;
  star.y = Math.random() * height;
}

function recycleStar(star) {
  let direction = "z";

  let vx = Math.abs(velocity.x),
    vy = Math.abs(velocity.y);

  if (vx > 1 || vy > 1) {
    let axis;

    if (vx > vy) {
      axis = Math.random() < vx / (vx + vy) ? "h" : "v";
    } else {
      axis = Math.random() < vy / (vx + vy) ? "v" : "h";
    }

    if (axis === "h") {
      direction = velocity.x > 0 ? "l" : "r";
    } else {
      direction = velocity.y > 0 ? "t" : "b";
    }
  }

  star.z = STAR_MIN_SCALE + Math.random() * (1 - STAR_MIN_SCALE);
  // star.x = Math.random();

  if (direction === "z") {
    star.z = 0.1;
    star.x = Math.random() * width;
    star.y = Math.random() * height;
  } else if (direction === "l") {
    star.x = -OVERFLOW_THRESHOLD;
    star.y = height * Math.random();
  } else if (direction === "r") {
    star.x = width + OVERFLOW_THRESHOLD;
    star.y = height * Math.random();
  } else if (direction === "t") {
    star.x = width * Math.random();
    star.y = -OVERFLOW_THRESHOLD;
  } else if (direction === "b") {
    star.x = width * Math.random();
    star.y = height + OVERFLOW_THRESHOLD;
  }
}

function resize() {
  scale = window.devicePixelRatio || 1;

  width = window.innerWidth * scale;
  height = window.innerHeight * scale;

  canvas.width = width;
  canvas.height = height;

  stars.forEach(placeStar);
}

function step() {
  context.clearRect(0, 0, width, height);

  update();
  render();

  requestAnimationFrame(step);
}

function update() {
  velocity.tx *= 0.76;
  velocity.ty *= 0.76;

  velocity.x += (velocity.tx - velocity.x) * 0.8;
  velocity.y += (velocity.ty - velocity.y) * 0.8;
  let i = 1;
  stars.forEach((star) => {
    i *= -1;
    velocity.x *= i;
    velocity.y *= i;
    // velocity.x += Math.random() * 0.01;
    // velocity.y += Math.random() * 0.01;

    star.x += velocity.x * star.z;
    star.y += velocity.y * star.z;

    star.x += (star.x - width / 2) * velocity.z * star.z;
    star.y += (star.y - height / 2) * velocity.z * star.z;
    star.z += velocity.z;

    // recycle when out of bounds
    if (
      star.x < -OVERFLOW_THRESHOLD ||
      star.x > width + OVERFLOW_THRESHOLD ||
      star.y < -OVERFLOW_THRESHOLD ||
      star.y > height + OVERFLOW_THRESHOLD
    ) {
      recycleStar(star);
    }
  });
}

function render() {
  stars.forEach((star) => {
    context.beginPath();
    context.lineCap = "round";
    context.lineWidth = STAR_SIZE * star.z * scale;
    context.globalAlpha = 0.5 + 0.5 * Math.random();
    context.strokeStyle = STAR_COLOR;

    context.beginPath();
    context.moveTo(star.x, star.y);

    var tailX = velocity.x * 0,
      tailY = velocity.y * 0;

    // stroke() wont work on an invisible line
    if (Math.abs(tailX) < 0.1) tailX = 0.5;
    if (Math.abs(tailY) < 0.1) tailY = 0.5;

    context.lineTo(star.x + tailX, star.y + tailY);

    context.stroke();
  });
}

function movePointer(x, y) {
  if (typeof pointerX === "number" && typeof pointerY === "number") {
    let ox = x - pointerX,
      oy = y - pointerY;

    velocity.tx = velocity.tx + (ox / 8) * scale * (touchInput ? 1 : -1);
    velocity.ty = velocity.ty + (oy / 8) * scale * (touchInput ? 1 : -1);
  }

  pointerX = x;
  pointerY = y;
}

function onMouseMove(event) {
  touchInput = false;

  movePointer(event.clientX, event.clientY);
}

function onTouchMove(event) {
  touchInput = true;

  movePointer(event.touches[0].clientX, event.touches[0].clientY, true);

  event.preventDefault();
}

function onMouseLeave() {
  pointerX = null;
  pointerY = null;
}

function App() {

  const emptyGame = [["", "", ""], ["", "", ""], ["", "", ""]]
  const [cells, setCells] = useState(emptyGame)
  const [winnerCells, setWinnerCells] = useState([[],[],[]])

  const X = "X"
  const O = "O"
  const [currentChar, setCurrentChar] = useState(X);
  const [winner, setWinner] = useState("");
  const [gameOver, setGameOver] = useState(false);

  

  useEffect(function() {
    isGameOver()
  }, [cells])

  function cellClick(row, column) {
    if (gameOver || winner) {
      return;
    }

    if (cells[row][column] != "") {
      return;
    }

    const newBoard = {...cells}
    newBoard[row][column] = currentChar
    setCells(newBoard)
    changeChar()
  }

  function changeChar() {
    if (currentChar == X) {
      setCurrentChar(O)
    } else {
      setCurrentChar(X)
    }
  }

  function reset() {
    setCells(emptyGame)
    setWinner("")
    setGameOver(false)
    setWinnerCells([[],[],[]])
  }

  function isGameOver() {
    switch (true) {
      case areTheSameInRow(0): return
      case areTheSameInRow(1): return
      case areTheSameInRow(2): return
      case areTheSameInColumn(0): return
      case areTheSameInColumn(1): return
      case areTheSameInColumn(2): return
      case areTheSameInDiagonal(): return
    }

    if (!cells[0].includes("") && !cells[1].includes("") && !cells[2].includes("")) {
      endGame("")
    }
  }

  function endGame(winner) {
    if (winner != "") setWinner(winner)
    setGameOver(true)
  }

  function areTheSameInRow(row) {
    if (cells[row][0] !== "" && cells[row][0] === cells[row][1] && cells[row][0] === cells[row][2]) {
      endGame(cells[row][0])
      
      const newWinner = [[],[],[]]
      newWinner[row][0] = true
      newWinner[row][1] = true
      newWinner[row][2] = true
      setWinnerCells(newWinner)
      return true
    }
    return false
  }

  function areTheSameInColumn(column) {
    if (cells[0][column] !== "" && cells[0][column] === cells[1][column] && cells[2][column] == cells[0][column]) {
      endGame(cells[0][column])
      
      const newWinner = [[],[],[]]
      newWinner[0][column] = true
      newWinner[1][column] = true
      newWinner[2][column] = true
      setWinnerCells(newWinner)
      return true
    }
    return false
  }

  function areTheSameInDiagonal() {
    if (cells[1][1] != "" && (cells[0][0] === cells[1][1] && cells[0][0] == cells[2][2])) {
      endGame(cells[1][1])
      const newWinner = [[],[],[]]
      newWinner[0][0] = true
      newWinner[1][1] = true
      newWinner[2][2] = true
      setWinnerCells(newWinner)
      return true
    }

    if (cells[1][1] != "" && (cells[2][0] === cells[1][1] && cells[2][0] == cells[0][2])) {
      endGame(cells[1][1])
      const newWinner = [[],[],[]]
      newWinner[0][2] = true
      newWinner[1][1] = true
      newWinner[2][0] = true
      setWinnerCells(newWinner)
      return true
    }
    return false
  }




  return (
    <div className="main-container">
      <div className="main-title">
        <h1>Tic-Tac-Toe</h1>
      </div>
      <div className="main-playGround">
      <header className="App-header"> 
        <AppContext.Provider value={{cells, setCells, cellClick, currentChar, winner, gameOver, winnerCells}}>
          <Header />
          <Board />
        </AppContext.Provider>

        <button className='btn-reset' onClick={() => reset()}>Reset</button>
      </header>
      </div>
    </div>
  );
}

export default App;
