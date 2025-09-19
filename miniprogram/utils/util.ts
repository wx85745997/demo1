export const formatTime = (date: Date) => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return (
    [year, month, day].map(formatNumber).join('/') +
    ' ' +
    [hour, minute, second].map(formatNumber).join(':')
  )
}

const formatNumber = (n: number) => {
  const s = n.toString()
  return s[1] ? s : '0' + s
}


export function playUntilFrame(
  animator: any,
  clipName: string,
  targetFrame: number,
  totalFrames: number,
  onComplete: () => void
) {
  console.log("开始动画")
  if (!animator) {
    console.warn('Animator 不存在')
    return
  }
  console.log("开始动画1")

  const clip = animator._clips.get(clipName)
  if (!clip) {
    console.warn(`找不到动画片段: ${clipName}`)
    return
  }
    console.log("开始动画2")

  clip.loop = false
  animator.play(clipName)
  console.log("开始动画3")

  // 动画总时长（秒）
  const duration = clip.duration || 0

  console.log("clip",clip)

  console.log("duration",duration)
  console.log("开始动画4")
  setTimeout(() => {
    animator.pause() // 在目标帧停下
    onComplete()
  }, 6000)
}
