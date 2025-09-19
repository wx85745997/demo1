/// <reference path="./types/index.d.ts" />
interface Animator {
  play?: (name: string) => void
  playIndex?: (idx: number) => void
  _clips?: Map<string, any>
}

type Gltf = {
  getInternalNodeByName?: (name: string) => any
  meshes?: any[]
  traverse?: (cb: (node: any) => void) => void
  _nodeMap?: Map<string, any> // 部分版本可用
  // 其它属性根据需要扩展
}


interface IAppOption {
  globalData: {
    userInfo?: WechatMiniprogram.UserInfo,
    animator: Animator | null,
    gltf: Gltf | null
  }
  userInfoReadyCallback?: WechatMiniprogram.GetUserInfoSuccessCallback,
}