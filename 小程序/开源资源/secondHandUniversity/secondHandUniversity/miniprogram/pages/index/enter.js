// miniprogram/pages/enter/enter.js
const DB = wx.cloud.database().collection('shop-users')
let userName = ''
let userUrl = ''
Page({

  /**
   * 页面的初始数据
   */
  data: {
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    users:[]
  },
  
  bindGetUserInfo: function (e) {
    wx.switchTab({
      url: '../index/index?_id={{item._id}}',  //注意switchTab只能跳转到tab页面，不能跳转到不带tab的页面
    })
    this.setData({
     users:e.detail.userInfo
    })

    
    
      DB.add({
        data: {
          userName:e.detail.userInfo.nickName,
          userUrl:e.detail.userInfo.avatarUrl,
        },
        success(res){
          console.log("成功",res)
        },
        fail(res){
          console.log("失败",res)
        }
      })

      DB.get({
        success(res) {
          console.log("请求成功",res)
          // that.setData({
          //   openId:res.data
          // })
        },
        fail(res) {
          console.log("请求失败",res)
        }
      })
    },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})