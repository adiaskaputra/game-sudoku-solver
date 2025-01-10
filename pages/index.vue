<script setup lang="ts">
import DEMO_BOARD from '@/api/sudoku-puzzle.json'

type History = {
  i: number
  j: number
  val: number
}

const getBorderTop = computed(() => {
  return (i) => {
    if (i === 0) return 'unset'
    if (i === 3 || i === 6) return 'solid 2px #D7E1F4'
    if (i > 0) return 'solid 3px #f4f6ff'
    return ''
  }
})

const getBorderLeft = computed(() => {
  return (j) => {
    if (j === 0) return 'unset'
    if (j === 3 || j === 6) return 'solid 2px #D7E1F4'
    if (j > 0) return 'solid 3px #f4f6ff'
    return ''
  }
})

const INIT_BOARDS = [
  [null, null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null, null],
]

const delayAnimation = ref<number>(0)
const isForceStop = ref<boolean>(false)
const isRandomPuzzle = ref<boolean>(false)
const loadingForceStop = ref<boolean>(false)

const puzzle = ref<any[]>($clone(INIT_BOARDS))
const boards = ref<any[]>($clone(INIT_BOARDS))

const histories = ref<History[]>([])
const isInvalidPuzzle = ref<boolean>(false)
const isInProgress = ref<boolean>(false)
const isSolved = ref<boolean>(false)

function checkGrid(i, j, fill) {
  let startI, startJ
  if (i === 0 || i === 1 || i === 2) startI = 0
  else if (i === 3 || i === 4 || i === 5) startI = 3
  else if (i === 6 || i === 7 || i === 8) startI = 6

  if (j === 0 || j === 1 || j === 2) startJ = 0
  else if (j === 3 || j === 4 || j === 5) startJ = 3
  else if (j === 6 || j === 7 || j === 8) startJ = 6

  for (let n = startI; n <= startI + 2; n++) {
    for (let m = startJ; m <= startJ + 2; m++) {
      if (n !== i && m !== j && fill === boards.value[n][m]) {
        return false
      }
    }
  }
  return true
}

function checkPerp(i, j, fill) {
  for (let n = 0; n < boards.value.length; n++) {
    if (boards.value[i][n] === fill && j !== n) return false
    if (boards.value[n][j] === fill && i !== n) return false
  }
  return true
}

function checkBoard() {
  for (let i = 0; i < boards.value.length; i++) {
    for (let j = 0; j < boards.value[i].length; j++) {
      if (boards.value[i][j]) {
        const isValidPerp = checkPerp(i, j, boards.value[i][j])
        const isValidGrid = checkGrid(i, j, boards.value[i][j])
        if (!isValidPerp || !isValidGrid) return false
      }
    }
  }
  return true
}

//
//  A C T I O N
//
function onInput(i, j, evt) {
  if (evt.data) boards.value[i][j] = +evt.data
  else boards.value[i][j] = null
}

async function forceStop() {
  loadingForceStop.value = true

  isForceStop.value = true
  await $delay(1000)
  isInProgress.value = false
  isInvalidPuzzle.value = false

  loadingForceStop.value = false
}

function resetLogic() {
  isForceStop.value = false
  isInvalidPuzzle.value = false
  isInProgress.value = false
  isSolved.value = false

  histories.value = []
  puzzle.value = $clone(INIT_BOARDS)
}

function resetPuzzle() {
  resetLogic()
  isRandomPuzzle.value = false

  nextTick(() => {
    boards.value = $clone(INIT_BOARDS)
  })
}

async function setAutoPuzzle() {
  if (isInProgress.value) await forceStop()
  nextTick(() => {
    resetPuzzle()
    nextTick(() => {
      isRandomPuzzle.value = true
      boards.value = $clone(DEMO_BOARD[Math.floor(Math.random() * 50 + 1)])
      nextTick(() => {
        puzzle.value = $clone(boards.value)
      })
    })
  })
}

async function setManualPuzzle() {
  if (isInProgress.value) await forceStop()
  nextTick(() => {
    resetPuzzle()
  })
}

async function solve() {
  if (isInProgress.value) return
  resetLogic()
  await nextTick()
  puzzle.value = $clone(boards.value)

  if (!checkBoard()) {
    isInvalidPuzzle.value = true
    resetLogic()
    return useNuxtApp().$toast.error('Puzzle is invalid')
  }

  isInProgress.value = true

  let defaultVal = 1
  let isBackTrack = false

  for (let i = 0; i <= boards.value.length - 1; ) {
    if (isForceStop.value) break
    for (let j = 0; j <= boards.value.length - 1; ) {
      if (isForceStop.value) break
      if (puzzle.value[i][j] === null) {
        // FILL VALUE
        for (let val = defaultVal; val <= 9; val++) {
          const isPerp = checkPerp(i, j, val)
          const isGrid = checkGrid(i, j, val)
          if (isPerp && isGrid) {
            boards.value[i][j] = val
            await $delay(delayAnimation.value)
            histories.value.push({ i, j, val })
            defaultVal = 1
            break
          } else if (val === 9) {
            // BACKTRACK
            isBackTrack = true
            let flag = true
            while (flag) {
              if (isForceStop.value) flag = false
              const backtrack = histories.value.pop()
              if (backtrack) {
                if (backtrack.val < 9) {
                  flag = false
                  defaultVal = backtrack.val + 1
                  i = backtrack.i
                  j = backtrack.j
                  boards.value[i][j] = null
                  await $delay(delayAnimation.value)
                } else {
                  boards.value[backtrack.i][backtrack.j] = null
                  await $delay(delayAnimation.value)
                }
              } else {
                flag = false
                isInvalidPuzzle.value = true
              }
            }
          }
        }
      }
      if (isForceStop.value) break
      if (!isBackTrack) j++
      if (isInvalidPuzzle.value) break
      isBackTrack = false
    }
    if (isForceStop.value) break
    if (!isBackTrack) i++
    if (isInvalidPuzzle.value) break
    isBackTrack = false
  }

  isInProgress.value = false

  if (isInvalidPuzzle.value) {
    resetLogic()
    return useNuxtApp().$toast.error('Puzzle is invalid')
  }

  if (!isForceStop.value) {
    isSolved.value = true
  }
}
</script>

<template>
  <div class="box-container">
    <div class="box">
      <div class="box__top">
        <div class="box__top__title">Sudoku Solver</div>
        <div class="box__top__action">
          <div class="btn btn-primary" @click.stop="setAutoPuzzle()">
            Auto puzzle
          </div>
          <div class="btn btn-primary" @click.stop="setManualPuzzle()">
            Manual puzzle
          </div>
          <div class="btn btn-primary" @click.stop="solve()">Solve</div>
        </div>
      </div>
      <div class="box__bottom"></div>
      <div class="board">
        <table>
          <tr v-for="(rows, i) in boards" :key="`row-${i}`">
            <td
              v-for="(item, j) in rows"
              :key="`col-${j}`"
              :style="{
                'border-top-left-radius': i === 0 && j === 0 ? '18px' : '',
                'border-top-right-radius':
                  i === 0 && j === boards.length - 1 ? '18px' : '',
                'border-bottom-left-radius':
                  i === boards.length - 1 && j === 0 ? '18px' : '',
                'border-bottom-right-radius':
                  i === boards.length - 1 && j === boards.length - 1
                    ? '18px'
                    : '',
                'border-top': getBorderTop(i),
                'border-left': getBorderLeft(j),
              }"
            >
              <span
                v-if="isInProgress || isSolved || puzzle[i][j]"
                :class="{ disabled: puzzle[i][j] }"
              >
                {{ item }}
              </span>
              <input
                v-else
                v-model="boards[i][j]"
                v-typing="'sudoku'"
                @input="onInput(i, j, $event)"
              />
            </td>
          </tr>
        </table>
      </div>
    </div>
  </div>
</template>

<style lang="postcss" scoped>
.box {
  @apply h-[780px] w-[700px] relative p-5  rounded-[18px];
  @apply overflow-hidden;

  &-container {
    @apply h-full;
    @apply flex justify-center items-center;
  }

  &__top {
    @apply h-[40%] bg-[#307df6];
    @apply rounded-tl-[18px];
    @apply rounded-tr-[18px];
    @apply pt-[28px] px-[60px];

    &__title {
      @apply text-white text-[2.8rem] text-center;
    }

    &__action {
      @apply flex justify-center items-center gap-3;
      @apply pt-8 px-5;
    }
  }

  &__bottom {
    @apply h-[60%] bg-slate-100;
    @apply rounded-bl-[18px];
    @apply rounded-br-[18px];
  }
}

.board {
  @apply absolute;
  @apply top-[210px] left-0 right-0 mx-auto text-center;

  table {
    @apply mx-auto rounded-[18px];

    tr {
      td {
        @apply bg-white;
        @apply size-[60px] text-[24px] text-center text-blue-500;
        @apply font-normal;

        input {
          @apply w-[100%] size-[40px];
          @apply text-[20px] text-center;
          border: unset !important;

          &:focus {
            outline: unset;
          }
        }

        .disabled {
          @apply text-gray-500;
        }
      }
    }
  }
}

.btn {
  @apply w-[100%] inline-block;
  @apply text-lg text-center text-nowrap;
  @apply py-[6px] px-[10px] rounded;
  @apply cursor-pointer;
  vertical-align: middle;
  -ms-touch-action: manipulation;
  touch-action: manipulation;
  border: 1px solid transparent;
  line-height: 1.42857143;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}

.btn.focus,
.btn:focus,
.btn:hover {
  @apply text-[#333];
  text-decoration: none;
}

.btn.active,
.btn:active {
  background-image: none;
  outline: 0;
  -webkit-box-shadow: inset 0 3px 5px rgba(0, 0, 0, 0.125);
  box-shadow: inset 0 3px 5px rgba(0, 0, 0, 0.125);
}

.btn.disabled,
.btn[disabled],
fieldset[disabled] .btn {
  @apply cursor-not-allowed;
  filter: alpha(opacity=65);
  opacity: 0.65;
  -webkit-box-shadow: none;
  box-shadow: none;
}

a.btn.disabled,
fieldset[disabled] a.btn {
  pointer-events: none;
}

.btn-primary {
  @apply bg-slate-100 text-gray-800 border-blue-100;
}

.btn-primary:hover {
  @apply bg-blue-100 text-gray-800 border-blue-400;
}
</style>
