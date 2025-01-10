export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.directive('typing', {
    beforeMount: (el: HTMLInputElement, binding: any) => {
      const { value: type } = binding

      //
      //  P A S T E
      //
      const paste = (evt: any) => {
        if (type === 'none') return true

        const clipboardData = evt.clipboardData.getData('text')

        if (type === 'sudoku') {
          if (clipboardData.length > 1) return evt.preventDefault()

          const pattern = /^[1-9]*$/i
          if (pattern.test(clipboardData)) return true
          else {
            return evt.preventDefault()
          }
        }
        return true
      }

      //
      //  K E Y P R E S S
      //
      const keypress = (evt: any) => {
        evt = evt || window.event

        if (type === 'sudoku') {
          if (/^([1-9])/.test(evt.key)) return true
          return evt.preventDefault()
        }
        return true
      }

      el.addEventListener('paste', (evt: any) => paste(evt))
      el.addEventListener('keypress', (evt: any) => keypress(evt))
    },
  })
})
