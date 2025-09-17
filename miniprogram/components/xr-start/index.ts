// components/xr-start/index.ts
Page({
  scene: null as any,



  /**
   * 页面的初始数据
   */
  data: {
    trackerOn: true,   // 初始允许追踪
    locked: false,
  },

  handleARReady({ detail }: any){
    this.scene = detail.value;        // 保存 XRScene
  },
  onModel1Loaded({ detail }: any) {
    const app = getApp<IAppOption>()
    const el = detail.value.target;              
    const animator = el.getComponent('animator');
    app.globalData.animator = animator 
  },

  onTrackerStateChange({detail}: any) {
    const xrFrameSystem = wx.getXrFrameSystem();

    const tracker = this.scene.getElementById('tracker').getComponent(xrFrameSystem.ARTracker);

    const {state, errorMessage} = tracker;


    tracker.el.event.add('ar-tracker-state', tracker => {
      const {state, errorMessage} = tracker;
      console.log("state",state)
    });
  

    console.log("state",state)

  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {

  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
})