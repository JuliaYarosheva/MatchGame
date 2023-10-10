class MatchGrid {
  //Set game data
  constructor(width, height, cols, rows, time, theme) {
    this.width = width;
    this.height = height;
    this.cols = cols;
    this.rows = rows;
    this.time = time;
    this.theme = theme;
  }

  gameStates = {
    cellsAmount: 0,
    selectedCardId: null,
    selectedCardThumbId: null,
    timerId: 0,
    gamePaused: false,
    pauseTime: this.time,
    isGameEnded: false,
  };

  utils = {
    //Function to shuffle the unique id pairs
    shuffleIds: (arr) => {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
    },

    //Function to animate card flip
    animation: (elem, playing) => {
      if (playing) return;

      playing = true;

      return anime({
        targets: elem,
        scale: [{ value: 1 }, { value: 1.4 }, { value: 1, delay: 150 }],
        rotateY: { value: "+=180", delay: 100 },
        easing: "easeInOutSine",
        duration: 50,
        complete: function () {
          playing = false;
        },
      });
    },

    disableGameBoard: (message) => {
      //clearInterval(this.gameStates.timerId);
      document.querySelector(".game__grey-layer").style.opacity = 0.7;
      document.querySelector(".game__grey-layer").style.zIndex = 10;
      document.querySelector(
        ".game__grey-layer"
      ).innerHTML = `<h2>${message}</h2>`;
    },
  };

  //Method to set the game theme
  setTheme() {
    document.querySelector(".game__wrapper").classList.add(this.theme);
  }

  //Method to create game matrix
  createGameMatrix() {
    //Get number of game cards
    this.gameStates.cellsAmount = this.cols * this.rows;
    this.gameStates.cellsAmount % 2 === 1
      ? (this.gameStates.cellsAmount -= 1)
      : this.gameStates.cellsAmount;

    //Get unique id pairs for game cards (game cards / 2), shuffle them in random order
    const uniqueIds = [...Array(this.gameStates.cellsAmount / 2)].map(
      (el, i) => i + 1
    );
    const uniqueIdPairs = [...uniqueIds, ...uniqueIds];
    this.utils.shuffleIds(uniqueIdPairs);

    return uniqueIdPairs;
  }

  //Method to create game board with cards
  createGameBoard() {
    const ids = this.createGameMatrix();

    //Define game cards size
    const cellWidth = this.width / this.cols;
    const cellHeight = this.height / this.rows;

    //Create array with game cards markup
    const cards = [];
    ids.forEach((num, index) => {
      cards.push(
        `<div style="width: ${cellWidth}px; height: ${cellHeight}px; font-size: ${
          cellWidth / 2
        }px"><div class="game__card" data-cardId="${index}${num}" data-id="${num}"><div class="game__card_inner"><div class="game__card_front">&#9825;</div><div class="game__card_back">${num}</div></div></div></div>`
      );
    });

    //Create game board with cards
    const boardMarkup = `<div class="game__board ${this.theme}" style="width: ${
      this.width
    }px; height: ${this.height}px;">${cards.reduce(
      (acc, cur) => acc + cur,
      ""
    )}<div class="game__grey-layer"></div></div>`;
    document.querySelector(".game__container").innerHTML = boardMarkup;
  }

  //Method to start game timer
  startTimer = (initialTime) => {
    let time = initialTime;
    const labelTimer = document.querySelector(".game__timer");

    const tick = () => {
      if (this.gameStates.gamePaused) return;

      const min = String(Math.trunc(time / 60)).padStart(2, 0);
      const sec = String(time % 60).padStart(2, 0);

      // In each call, print the remaining time to UI
      labelTimer.textContent = `${min}:${sec}`;

      // When 0 seconds, stop timer
      if (time === 0) {
        this.endGame();
        this.utils.disableGameBoard("Time's up!");
      }

      // Decrease 1s
      time--;
      //this.gameStates.pauseTime = time;
    };

    // Call the timer every second
    this.gameStates.timerId = setInterval(tick, 1000);
  };

  //Method to pause and resume timer
  pauseResumeTimer = (pause = true) => {
    if (this.gameStates.isGameEnded) return;

    if (!this.gameStates.gamePaused && pause) {
      //If timer is going - pause the timer and disable the activity area
      this.gameStates.gamePaused = true;
      this.utils.disableGameBoard("Paused");
    }

    if (this.gameStates.gamePaused && !pause) {
      //If timer is paused - resume the timer and enable the activity area
      this.gameStates.gamePaused = false;
      //this.startTimer(this.gameStates.pauseTime);
      document.querySelector(".game__grey-layer").style.opacity = 0;
      document.querySelector(".game__grey-layer").style.zIndex = -1;
    }
  };

  resetGameState = () => {
    this.gameStates.cellsAmount = 0;
    this.gameStates.selectedCardId = null;
    this.gameStates.selectedCardThumbId = null;
    this.gameStates.timerId = 0;
    this.gameStates.gamePaused = false;
    this.gameStates.pauseTime = this.time;
  };

  //Method to end the game (clear timer, remove game board)
  endGame = () => {
    this.gameStates.isGameEnded = true;

    clearInterval(this.gameStates.timerId);
    this.resetGameState();
  };

  reloadGame = () => {
    this.gameStates.isGameEnded = false;

    document.querySelector(".game__container").innerHTML = "";
    clearInterval(this.gameStates.timerId);
    this.resetGameState();
    document.querySelector(".game__timer").textContent = "00:00";
  };

  //Method to handle click on game card
  handleCardClick(e) {
    //Animate the card flip
    const animation = this.utils.animation(
      e.currentTarget.querySelector(".game__card_inner"),
      false
    );
    animation.play();
    //Indicate the active card
    e.currentTarget.classList.add("active");
    const dataId = e.currentTarget.dataset.id;
    const dataCardId = e.currentTarget.dataset.cardid;

    //Check if card are matching
    this.checkCardsMatch(Number(dataId), Number(dataCardId));
  }

  //Method to check if cards are matching and handle result
  checkCardsMatch(currentId, selectedCardThumbId) {
    if (this.gameStates.selectedCardId === null) {
      this.gameStates.selectedCardId = currentId;
      this.gameStates.selectedCardThumbId = selectedCardThumbId;
    } else if (
      //If cards are matching, disable them and remove active state
      this.gameStates.selectedCardId === currentId &&
      this.gameStates.selectedCardThumbId !== selectedCardThumbId
    ) {
      const elements = document.querySelectorAll(
        '[data-id="' + this.gameStates.selectedCardId + '"]'
      );

      setTimeout(() => {
        elements.forEach((el) => {
          el.classList.remove("active");
          el.classList.add("disabled");
          el.removeEventListener("click", this.handleCardClick);

          const disabled = document.querySelectorAll(".disabled").length;

          //If all cards are matched - disable the activity area and stop the game
          if (disabled === this.gameStates.cellsAmount) {
            this.utils.disableGameBoard("You won!");
            this.endGame();
          }
        });
      }, 600);
      this.gameStates.selectedCardId = null;
      this.gameStates.selectedCardThumbId = null;
    } else {
      //If cards are NOT matching, flip them back and remove active state
      const elements = document.querySelectorAll(".active");

      setTimeout(() => {
        elements.forEach((el) => {
          el.classList.remove("active");
          const animation = this.utils.animation(
            el.querySelector(".game__card_inner"),
            false
          );
          animation.play();
        });
      }, 600);
      this.gameStates.selectedCardId = null;
      this.gameStates.selectedCardThumbId = null;
    }
  }

  //Method to add events to interactive elements
  addEvents() {
    document.querySelector(".btn-reload").addEventListener("click", () => {
      this.reloadGame();
      this.initGame();
    });

    document.querySelectorAll(".game__card").forEach((el) => {
      el.addEventListener("click", (e) => {
        if (
          !el.classList.contains("disabled") &&
          !el.classList.contains("active")
        ) {
          this.handleCardClick(e);
        }
      });
    });

    document
      .querySelector(".game__board")
      .addEventListener("mouseleave", () => this.pauseResumeTimer(true));

    document
      .querySelector(".game__board")
      .addEventListener("mouseenter", () => this.pauseResumeTimer(false));
  }

  //Method to start the game
  initGame() {
    this.setTheme();
    this.createGameBoard();
    this.addEvents();
    this.startTimer(this.time);
  }
}

// Please set data for MatchGrid game intanse in data types:
// width: Number,
// height: Number,
// columns: Number,
// rows: Number,
// time: Number (ms)
// theme: String (dark, light)

const gameGrid = new MatchGrid(600, 600, 5, 5, 300, "light");
gameGrid.initGame();
