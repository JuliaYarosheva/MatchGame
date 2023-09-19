function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

class MatchGrid {
  //Set game data
  constructor(width, height, cols, rows, time, theme) {
    this.width = width;
    this.height = height;
    this.cols = cols;
    this.rows = rows;
    this.time = time;
    this.theme = theme;
    this.cellsAmount = 0;
    this.selectedCardId = null;
    this.selectedCardThumbId = null;
    this.timerId = 0;
    this.gamePaused = false;
  }

  setTheme() {
    document.querySelector(".game__wrapper").classList.add(this.theme);
  }

  createGameMatrix() {
    //Get number of game cards
    this.cellsAmount = this.cols * this.rows;
    this.cellsAmount % 2 === 1 ? (this.cellsAmount -= 1) : this.cellsAmount;

    //Get unique id pairs for game cards (game cards / 2), shuffle them in random order
    const uniqueIds = [...Array(this.cellsAmount / 2)].map((el, i) => i + 1);
    const uniqueIdPairs = [...uniqueIds, ...uniqueIds];
    shuffleArray(uniqueIdPairs);

    return uniqueIdPairs;
  }

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

  startTimer() {
    let time = this.time;
    const labelTimer = document.querySelector(".game__timer");
    const tick = function () {
      const min = String(Math.trunc(time / 60)).padStart(2, 0);
      const sec = String(time % 60).padStart(2, 0);

      // In each call, print the remaining time to UI
      labelTimer.textContent = `${min}:${sec}`;

      // When 0 seconds, stop timer
      if (time === 0) {
        clearInterval(this.timerId);
        document.querySelector(".game__grey-layer").style.opacity = 0.7;
        document.querySelector(".game__grey-layer").style.zIndex = 10;
        document.querySelector(
          ".game__grey-layer"
        ).innerHTML = `<h2>Time's up!</h2>`;
      }

      // Decrease 1s
      time--;
    };

    // Call the timer every second
    tick();
    this.timerId = setInterval(tick, 1000);
  }

  pauseResumeTimer() {
    if (this.gamePaused === false) {
      this.gamePaused = true;
      clearInterval(this.timerId);
      document.querySelector(".game__grey-layer").style.opacity = 0.7;
      document.querySelector(".game__grey-layer").style.zIndex = 10;
      document.querySelector(".game__grey-layer").innerHTML = `<h2>Paused</h2>`;
    } else {
      this.gamePaused = false;
      document.querySelector(".game__grey-layer").style.opacity = 0;
      document.querySelector(".game__grey-layer").style.zIndex = -1;
    }
  }

  endGame() {
    document.querySelector(".game__container").innerHTML = "";
    if (this.timerId !== 0) {
      clearInterval(this.timerId);
    }
  }

  animation(elem, playing) {
    if (playing) return;

    playing = true;

    return anime({
      targets: elem,
      scale: [{ value: 1 }, { value: 1.4 }, { value: 1, delay: 150 }],
      rotateY: { value: "+=180", delay: 100 },
      easing: "easeInOutSine",
      duration: 300,
      complete: function () {
        playing = false;
      },
    });
  }

  handleCardClick(e) {
    const animation = this.animation(
      e.currentTarget.querySelector(".game__card_inner"),
      false
    );
    animation.play();
    e.currentTarget.classList.add("active");

    const dataId = e.currentTarget.dataset.id;
    const dataCardId = e.currentTarget.dataset.cardid;

    this.checkCardsMatch(Number(dataId), Number(dataCardId));
  }

  checkCardsMatch(currentId, selectedCardThumbId) {
    if (this.selectedCardId === null) {
      this.selectedCardId = currentId;
      this.selectedCardThumbId = selectedCardThumbId;
    } else if (
      this.selectedCardId === currentId &&
      this.selectedCardThumbId !== selectedCardThumbId
    ) {
      const elements = document.querySelectorAll(
        '[data-id="' + this.selectedCardId + '"]'
      );

      setTimeout(() => {
        elements.forEach((el) => {
          el.classList.remove("active");
          el.classList.add("disabled");
          el.removeEventListener("click", this.handleCardClick);

          const disabled = document.querySelectorAll(".disabled").length;

          if (disabled === this.cellsAmount) {
            clearInterval(this.timerId);
            document.querySelector(".game__grey-layer").style.opacity = 0.7;
            document.querySelector(".game__grey-layer").style.zIndex = 10;
            document.querySelector(
              ".game__grey-layer"
            ).innerHTML = `<h2>You won!</h2>`;
          }
        });
      }, 600);
      this.selectedCardId = null;
      this.selectedCardThumbId = null;
    } else {
      const elements = document.querySelectorAll(".active");

      setTimeout(() => {
        elements.forEach((el) => {
          el.classList.remove("active");
          const animation = this.animation(
            el.querySelector(".game__card_inner"),
            false
          );
          animation.play();
        });
      }, 600);
      this.selectedCardId = null;
      this.selectedCardThumbId = null;
    }
  }

  addEvents() {
    document
      .querySelector(".btn-reload")
      .addEventListener("click", () => this.initGame());

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

    // document
    //   .querySelector(".game__container")
    //   .addEventListener("mouseleave, mauseenter", () => this.pauseResumeTimer());

    document
      .querySelector(".btn-pause")
      .addEventListener("click", () => this.pauseResumeTimer());
  }

  initGame() {
    this.setTheme();
    this.endGame();
    this.createGameBoard();
    this.startTimer();
    this.addEvents();
  }
}

// Please set data for MatchGrid game intanse in data types:
// width: Number,
// height: Number,
// columns: Number,
// rows: Number,
// time: Number (ms)
// theme: String (dark, light)

const gameGrid = new MatchGrid(600, 600, 5, 5, 600, "light");

gameGrid.initGame();
