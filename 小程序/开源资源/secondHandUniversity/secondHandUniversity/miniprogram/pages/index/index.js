
Page({
  data: {
    shopList:[],
    userList:[],
    isShow:true,
    imgUrls:[
      'https://ss0.bdstatic.com/70cFvHSh_Q1YnxGkpoWK1HF6hhy/it/u=3205342688,4225907114&fm=26&gp=0.jpg',
      'https://ss2.bdstatic.com/70cFvnSh_Q1YnxGkpoWK1HF6hhy/it/u=4048818314,2316053512&fm=26&gp=0.jpg'
    ],
    activeTypeId:'01',
    type: '',
    // 类型的数据配置
    typeCat: [{
      id:'0',name:'电子产品',
    },
    {
      id:'1',name:'生活用品',
    },
    {
      id:'2',name:'小吃零食',
    },
    {
      id:'3',name:'书籍资料',
    }]
    
  },
  typeSwitch(e) {
    this.setData({
      activeTypeId:e.currentTarget.dataset.id,
      
    })

    let that = this
   
     
    // 数据库
    wx.cloud.database().collection("shop-list").where({
      // _openid: 'user-open-id',
      id:e.currentTarget.dataset.id
    }).get({
      success(res) {
        console.log("请求成功",res)
        that.setData({
          shopList:res.data
        })
      },
      fail(res) {
        console.log("请求失败",res)
      }
    })
    
    
  },
  
 
  // 按需加载
  onLoadChoose() {
    
  },
  onLoad() {
    wx.cloud.callFunction({
      name:"shopOpenId",
      success(res){
        console.log(res)
        var openId = res.result.event.userInfo.openId
      },
      fail(res){
        console.log(res)
      }
    })

    let that = this
    wx.cloud.database().collection("shop-list").where({
      openId:that.openId
    }).get({
      success(res) {
        console.log("请求成功",res)
        that.setData({
          shopList:res.data
        })
      },
      fail(res) {
        console.log("请求失败",res)
      }
    })
    wx.cloud.database().collection("shop-users").where({
      openId:that.openId
    }).get({
      success(res) {
        console.log("请求成功",res)
        that.setData({
          userList:res.data
        })
      },
      fail(res) {
        console.log("请求失败",res)
      }
    })
  },

})
