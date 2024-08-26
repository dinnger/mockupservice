const increaseBackOffTime = (currentBackoffTime) => currentBackoffTime * 2
const calculateBackOffDelayMs = (backoffTime) => 1000 * (backoffTime + Math.random())

export const retryAsync = ({ minTime = 1, maxTime = 5 } = {}) => ({ fn, onSuccess, onError, onErrorEnd, args = null }) => {
  const _run = (currentTime) => {
    setTimeout(async () => {
      try {
        const result = await fn(args)

        if (onSuccess) {
          onSuccess(result)
        }
      } catch (error) {
        if (currentTime - 1 >= maxTime) {
          if (onErrorEnd) {
            onErrorEnd(error, args)
          }
          return
        }

        if (onError) {
          onError(error)
        }

        _run(increaseBackOffTime(currentTime))
      }
    }, calculateBackOffDelayMs(currentTime))
  }

  return _run(minTime)
}
