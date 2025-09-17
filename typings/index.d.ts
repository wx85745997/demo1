/// <reference path="./types/index.d.ts" />
interface Animator {
  play?: (name: string) => void
  playIndex?: (idx: number) => void
  _clips?: Map<string, any>
}


interface IAppOption {
  globalData: {
    userInfo?: WechatMiniprogram.UserInfo,
    animator: Animator | null
  }
  userInfoReadyCallback?: WechatMiniprogram.GetUserInfoSuccessCallback,
}