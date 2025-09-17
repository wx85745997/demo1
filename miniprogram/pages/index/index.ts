import { playUntilFrame } from '../../utils/util'

Page({

  handleBoom() {
    const app = getApp<IAppOption>()
    const animator = app.globalData.animator
    if (!animator) {
      wx.showToast({ title: '模型未就绪', icon: 'none' })
      return
    }
    playUntilFrame(animator, 'Animation#0', 160, 250)
  },
  data: {
    width: 300,
    height: 300,
    renderWidth: 300,
    renderHeight: 300,
  },
  onLoad() {
    const info = wx.getSystemInfoSync();
    const width = info.windowWidth;
    const height = info.windowHeight;
    const dpi = info.pixelRatio;
    this.setData({
      width, height,
      renderWidth: width * dpi,
      renderHeight: height * dpi
    });
  },
})