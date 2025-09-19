// components/xr-start/index.ts
const PLACE_STATE = {
  PLACING: 0,   // 初始，等待用户点地面放置模型
  INTERACT: 1,  // 模型已放置，可以旋转/缩放/平移等
}

const STATE = { NONE: -1, MOVE: 0, ZOOM_OR_PAN: 1 }  //单指or双指
const GESTURE = { NONE: 0, TAP: 1, ROTATE: 2 }           // 单指细分


const TAP_MOVE_THRESHOLD_PX = 10;    // 单指移动超过此距离，判定为旋转
const TAP_TIME_THRESHOLD_MS = 220;   // 持续时间小于此值，且位移小，判定为点击


Page({
  xrScene: null as any,
  cameraEl: null as any,
  modelRootEl: null as any,
  placedOnce: false,
  tmpV3: null,
  mat: null,
  radius: 0,
  rotateSpeed: 0,
  _pendingHit: null,

  placeState: PLACE_STATE.PLACING,
  handleTouchStart: null as any,
  mouseInfo: null as any,
  handleTouchMove: null as any,
  handleTouchEnd: null as any,
  handleRotate: null as any,
  handleZoomOrPan: null as any,
  pickAndHighlight: null as any,

  gltfItemTRS: null as any,
  gltfItemSubTRS: null as any,

  gesture: null as any,
  tapStartX: null as any,
  tapStartY: null as any,
  tapStartTime: null as any,




  /**
   * 页面的初始数据
   */
  data: {
    trackerOn: true,   // 初始允许追踪
    locked: false,
    placed: false,
    reticleVisible: false,
    reticlePos: '0 0 0',
  },


  onModelLoaded({ detail }: any) {
    const app = getApp<IAppOption>()
    const el = detail.value.target;
    const animator = el.getComponent('animator');
    app.globalData.animator = animator

    const gltf = el.getComponent('gltf');
    app.globalData.gltf = animator

    console.log("gltf", gltf)

    // 遍历所有 mesh
    const meshes = gltf.meshes;
    meshes.forEach((mesh: any) => {

    })
    let targetEl = gltf.getInternalNodeByName("3d66-Editable_mesh-20385071-001");
    console.log("targetEl", targetEl)


    // 常见可遍历集合（有的版本是 gltf.meshes，有的是 gltf.nodes，先试 meshes）
    const parts = gltf.meshes || []
    // for (let i = 0; i < parts.length; i++) {
    //   const part = parts[i];

    //   try {
    //     // 挂载 shape 组件
    //     part.addComponent('box-shape');

    //     // 监听点击
    //     part.event.add('touch-shape', (ev) => {
    //       const n = ev && ev.value ? ev.value.target : null;
    //       if (n) {
    //         console.log('命中部件:', n.id || n.name || n);
    //       }
    //     });
    //   } catch (e) {
    //     console.warn('无法添加 shape 给部件', part, e);
    //   }
    // }



  },

  pendingTouchModel: function (e: any) {
    this._pendingHit = e.detail.value;  // 只是暂存
    // const xrSystem = wx.getXrFrameSystem();
    // const raycastHit = new xrSystem.RaycastHit(this.xrScene);
    // const desc = {
    //   origin: xrSystem.Vector3.createFromArray(this._pendingHit.origin),
    //   unitDir: xrSystem.Vector3.createFromArray(this._pendingHit.dir),
    //   distance: 10000,
    //   hit: raycastHit
    // }

    // if (this.xrScene.physics.raycast(desc)) {
    //   wx.showToast({ title: '---相交了--', icon: 'none' })
    //   if (desc.hit) {
    //     const points = desc.hit.point.toArray()
    //     const shadow = this.xrScene.getElementById("shadow")
    //     const mesh = this.xrScene.createElement(xrSystem.XRMesh)
    //     mesh.setAttribute("geometry", "cube")
    //     mesh.setAttribute("node-id", "dynamicCube")
    //     mesh.setAttribute("scale", "0.2 0.2 0.2")
    //     mesh.setAttribute("position", points.join(" "))
    //     mesh.setAttribute("states", "alphaMode: BLEND")
    //     mesh.setAttribute("uniforms", "u_baseColorFactor: 1 0 0 1")
    //     shadow.addChild(mesh)
    //   }
    // }

  },

  touchModel() {
    // console.log("target", this._pendingHit.target)
    // console.log("shape", this._pendingHit.shape)
    // console.log(this._pendingHit.dir)
    const xrSystem = wx.getXrFrameSystem();

    // 1) 拿到要显示/隐藏的节点
    const scene = this.xrScene;
    const setitem1 = scene.getElementById('setitem1');

    // 2) 拿到视频纹理
    const video = scene.assets.getAsset('video-texture', 'introVideo');
    if (!video) return;

    // 3) 切换显示/播放状态
    const willShow = xrSystem.EVideoState.Playing;
    setitem1.setAttribute('visible', willShow);

    if (willShow) {
      // 显示并确保播放
      // 有的端需要 play，有的端是 resume，这里都尝试一下
      video.play();
      if (video.state === xrSystem.EVideoState.Paused) {
        video.resume();
      }
    } else {
      // 隐藏并暂停
      if (video.state === xrSystem.EVideoState.Playing) {
        video.pause();
      }
    }
  },


  handleAssetsProgress: function ({ detail }: any) {
    console.log('assets progress', detail.value);
  },

  handleAssetsLoaded: function ({ detail }: any) {
    console.log('assets loaded', detail.value);
    // this.setData({loaded: true});
    const xrSystem = wx.getXrFrameSystem();


    this.xrScene.event.addOnce('touchstart', this.placeNode.bind(this));
    // const video = this.xrScene?.assets?.getAsset?.('video-texture', 'video-introVideo'); // 注意两个参数
    // if (video && video.state !== xrSystem.EVideoState.Playing) {
    //   // 有的端是 .play()，有的端要 .resume()，两种都尝试一下更稳
    //   video.play();
    //   video.resume();
    // }


  },
  showText() {
    const wrap = this.xrScene.getElementById('setitem1')   // 文本容器
    const product = this.xrScene.getElementById('product') // 模型 xr-gltf

    if (!wrap || !product) return

    const xr = wx.getXrFrameSystem()

    const t = product.getComponent(xr.Transform) // Transform 组件
    if (!t) return

    // 取模型的世界坐标
    const pos = t.worldPosition
    console.log("pos", pos)
    if (!pos) return

    // 把文本容器放到模型正上方 0.2m
    // wrap.setAttribute('position', `${pos.x} ${pos.y } ${pos.z}`) 
    //wrap.setWorldPosition(pos.x, pos.y + 0.2, pos.z)

    // 可选：让文字一直朝向相机，便于阅读
    // const cam = this.xrScene.getElementById('camera')
    // if (wrap.lookAt && cam) {
    //   wrap.lookAt(cam)
    // }

    // 显示
    wrap.visible = true
  },


  handleARReady({ detail }: any) {
    console.log("------ARReady-----")
    const info = wx.getSystemInfoSync();
    console.log('基础库版本：', info.SDKVersion);
    console.log("info", info)

    this.mat = new (wx.getXrFrameSystem().Matrix4)();
    this.xrScene = detail.el
    const { width, height } = this.xrScene
    // 旋转缩放相关配置
    this.radius = (width + height) / 4
    this.rotateSpeed = 5

    const xrFrameSystem = wx.getXrFrameSystem();
    this.tmpV3 = new (xrFrameSystem.Vector3)();

    console.log('arReady', this.xrScene.ar.arVersion);
    console.log("this.xrScene", this.xrScene)

    const hasRaycast = !!(this.xrScene && typeof this.xrScene.raycast === 'function');
    const hasPick = !!(this.xrScene && typeof this.xrScene.pick === 'function');

    console.log('has raycast:', hasRaycast, 'has pick:', hasPick);

    // 列出可调用的方法名，帮你确认到底暴露了哪些
    Object.keys(this.xrScene).forEach(k => {
      if (typeof (this.xrScene as any)[k] === 'function') console.log('scene fn:', k);
    });

    const tracker = this.xrScene.getElementById('tracker').getComponent(xrFrameSystem.ARTracker);
    const { state, errorMessage } = tracker;
    tracker.el.event.add('ar-tracker-state', tracker => {
      const { state, errorMessage } = tracker;
      console.log(state, errorMessage)



    });
    console.log(state, errorMessage)

    tracker.el.event.add('track', (event: any) => {
      console.log("event", event)
    });





    this.cameraEl = this.xrScene.getElementById('camera');
    this.modelRootEl = this.xrScene.getElementById('modelRoot');
    this.xrScene.event.addOnce('touchstart', this.placeNode.bind(this));


    //  手势
    this.handleTouchStart = (event) => {
      console.log("---handleTouchStart---")
      this.mouseInfo = { startX: 0, startY: 0, isDown: false, startPointerDistance: 0, state: STATE.NONE }
      this.mouseInfo.isDown = true

      const touch0 = event.touches[0]
      const touch1 = event.touches[1]

      if (event.touches.length === 1) {
        // 单指：先认定是 TAP 候选；STATE 仍按你原来的 MOVE




        this.mouseInfo.startX = touch0.pageX
        this.mouseInfo.startY = touch0.pageY
        this.mouseInfo.state = STATE.MOVE

        // 记录 tap 起点与时间
        this.gesture = GESTURE.TAP
        this.tapStartX = touch0.pageX
        this.tapStartY = touch0.pageY
        this.tapStartTime = Date.now()
        console.log("111")



      } else if (event.touches.length === 2) {
        console.log("222")
        const dx = (touch0.pageX - touch1.pageX)
        const dy = (touch0.pageY - touch1.pageY)
        this.mouseInfo.startPointerDistance = Math.sqrt(dx * dx + dy * dy)
        this.mouseInfo.startX = (touch0.pageX + touch1.pageX) / 2
        this.mouseInfo.startY = (touch0.pageY + touch1.pageY) / 2
        this.mouseInfo.state = STATE.ZOOM_OR_PAN
      }

      this.xrScene.event.add('touchmove', this.handleTouchMove.bind(this))
      this.xrScene.event.addOnce('touchend', this.handleTouchEnd.bind(this))

    },
      // this.handleTouchMove = (event) => {
      //   const mouseInfo = this.mouseInfo
      //   if (!mouseInfo.isDown) {
      //     return
      //   }

      //   switch (mouseInfo.state) {
      //     case STATE.MOVE:
      //       if (event.touches.length === 1) {
      //         // ------ 单指细分：TAP → ROTATE 判定 ------
      //         if (this.gesture === GESTURE.TAP) {
      //           const x = event.touches[0].pageX
      //           const y = event.touches[0].pageY
      //           const dx = x - this.tapStartX
      //           const dy = y - this.tapStartY
      //           if (Math.hypot(dx, dy) > TAP_MOVE_THRESHOLD_PX) {
      //             this.gesture = GESTURE.ROTATE   // 发生“拖动”，改判为旋转
      //           }
      //           // 一旦是旋转，就调用你已有的旋转逻辑
      //           if (this.gesture === GESTURE.ROTATE) {
      //             this.handleRotate(event)
      //           }
      //         }
      //         // 只要判定成 ROTATE，就走你现有的旋转逻辑
      //         if (this.gesture === GESTURE.ROTATE) {
      //           this.handleRotate(event)
      //         }
      //         //this.handleRotate(event)
      //       } else if (event.touches.length === 2) {
      //         // 支持单指变双指，兼容双指操作但是两根手指触屏时间不一致的情况
      //         this.xrScene.event.remove('touchmove', this.handleTouchMove)
      //         this.xrScene.event.remove('touchend', this.handleTouchEnd)
      //         this.handleTouchStart(event)
      //       }
      //       break
      //     case STATE.ZOOM_OR_PAN:
      //       if (event.touches.length === 1) {
      //         // 感觉双指松掉一指的行为还是不要自动切换成旋转了，实际操作有点奇怪
      //       }
      //       else if (event.touches.length === 2) {
      //         this.handleZoomOrPan(event)
      //       }
      //       break
      //     default:
      //       break
      //   }
      // }

      this.handleTouchMove = (event) => {
        const mouseInfo = this.mouseInfo
        if (!mouseInfo.isDown) return

        switch (mouseInfo.state) {
          case STATE.MOVE: {
            if (event.touches.length === 1) {
              // 单指：决定 TAP → ROTATE
              if (this.gesture === GESTURE.TAP) {
                const x = event.touches[0].pageX
                const y = event.touches[0].pageY
                const dx = x - this.tapStartX
                const dy = y - this.tapStartY
                if (Math.hypot(dx, dy) > TAP_MOVE_THRESHOLD_PX) {
                  this.gesture = GESTURE.ROTATE   // 超过阈值，认定为旋转
                }
              }
              // 一旦是旋转，就调用你已有的旋转逻辑
              if (this.gesture === GESTURE.ROTATE) {
                this.handleRotate(event)
              }
            } else if (event.touches.length === 2) {
              // 单指→双指切换（保留你的原逻辑）
              this.xrScene.event.remove('touchmove', this.handleTouchMove)
              this.xrScene.event.remove('touchend', this.handleTouchEnd)
              this.handleTouchStart(event)
            }
            break
          }
          case STATE.ZOOM_OR_PAN: {
            if (event.touches.length === 2) {
              this.handleZoomOrPan(event) // 原缩放/平移逻辑
            }
            break
          }
          default: break
        }
      }

    // this.handleTouchEnd = (event) => {
    //   this.mouseInfo.isDown = false
    //   this.mouseInfo.state = STATE.NONE

    //   this.xrScene.event.remove('touchmove', this.handleTouchMove)
    //   this.xrScene.event.addOnce('touchstart', this.handleTouchStart)
    // }

    // ====== 增强：手势结束 ======
    this.handleTouchEnd = (event) => {
      console.log("---结束---")
      const durationOk = (Date.now() - this.tapStartTime) < TAP_TIME_THRESHOLD_MS
      const wasTap = (this.gesture === GESTURE.TAP) && durationOk

      if (wasTap) {
        this.touchModel()
      }

      // 复位
      this.mouseInfo.isDown = false
      this.mouseInfo.state = STATE.NONE
      this.gesture = GESTURE.NONE

      this.xrScene.event.remove('touchmove', this.handleTouchMove)
      this.xrScene.event.addOnce('touchstart', this.handleTouchStart)
    }



    this.handleRotate = (event) => {
      const x = event.touches[0].pageX
      const y = event.touches[0].pageY

      const { startX, startY } = this.mouseInfo

      const theta = (x - startX) / this.radius * - this.rotateSpeed
      const phi = (y - startY) / this.radius * - this.rotateSpeed
      if (Math.abs(theta) < .01 && Math.abs(phi) < .01) {
        return
      }
      this.gltfItemTRS.rotation.x -= phi
      this.gltfItemSubTRS.rotation.y -= theta
      this.mouseInfo.startX = x
      this.mouseInfo.startY = y
    }

    this.handleZoomOrPan = (event) => {
      const touch0 = event.touches[0]
      const touch1 = event.touches[1]

      const dx = (touch0.pageX - touch1.pageX)
      const dy = (touch0.pageY - touch1.pageY)
      const distance = Math.sqrt(dx * dx + dy * dy)

      let deltaScale = distance - this.mouseInfo.startPointerDistance
      this.mouseInfo.startPointerDistance = distance
      this.mouseInfo.startX = (touch0.pageX + touch1.pageX) / 2
      this.mouseInfo.startY = (touch0.pageY + touch1.pageY) / 2
      if (deltaScale < -2) {
        deltaScale = -2
      } else if (deltaScale > 2) {
        deltaScale = 2
      }

      const s = deltaScale * 0.02 + 1
      // 缩小
      this.gltfItemTRS.scale.x *= s
      this.gltfItemTRS.scale.y *= s
      this.gltfItemTRS.scale.z *= s
    }
  },

  placeNode(event: any) {
    console.log("placeNode", event)
    const xrFrameSystem = wx.getXrFrameSystem()
    const { clientX, clientY } = event.touches[0];
    const { frameWidth: width, frameHeight: height } = this.xrScene;

    if (clientY / height > 0.8 && clientX / width < 0.2) {
      this.xrScene.getNodeById('setitem').visible = false;
      this.xrScene.ar.resetPlane();
    } else {
      this.xrScene.ar.placeHere('setitem', true);

    }
    this.placeState = PLACE_STATE.INTERACT


    const anchorTRS = this.xrScene.getElementById('anchor').getComponent(xrFrameSystem.Transform)
    anchorTRS.setData({ visible: false })
    anchorTRS.scale.x = 0
    anchorTRS.scale.y = 0
    anchorTRS.scale.z = 0

    // 获取改动元素
    console.log("--获取改动元素---")
    this.gltfItemTRS = this.xrScene.getElementById('preview-model').getComponent(xrFrameSystem.Transform)
    this.gltfItemSubTRS = this.xrScene.getElementById('preview-model-sub').getComponent(xrFrameSystem.Transform)
    console.log("this.gltfItemTRS", this.gltfItemTRS)
    console.log("this.gltfItemSubTRS", this.gltfItemSubTRS)

    // 开启旋转缩放逻辑
    this.xrScene.event.addOnce('touchstart', this.handleTouchStart)


    //this.xrScene.event.addOnce('touchstart', this.placeNode.bind(this));
  },

  // handleARTrackerState({detail}: any) {
  //   const xrFrameSystem = wx.getXrFrameSystem();

  //   const tracker = this.xrScene.getElementById('tracker').getComponent(xrFrameSystem.ARTracker);

  //   const {state, errorMessage} = tracker;


  //   tracker.el.event.add('ar-tracker-state', tracker => {
  //     const {state, errorMessage} = tracker;
  //     console.log("state",state)
  //   });


  //   console.log("state",state)

  // },

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