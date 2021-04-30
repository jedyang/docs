// miniprogram/pages/publish/publish.j
const DB = wx.cloud.database().collection('shop-list')
let id = ""
let title = ""
let price = 0
let des = ""
let tell = 0
let addr = ""
let collection = 0
let comment = 0
let date = 0
let pic = []
Page({
  /**
   * 页面的初始数据
   */
  data: {
    items: [
      {id: '0', value: '电子产品'},
      {id: '1', value: '生活用品', checked: 'true'},
      {id: '2', value: '小吃零食'},
      {id: '3', value: '书籍资料'},
      
    ],
    // pic:[],

  },
  radioChange: function(e) {
    console.log('radio发生change事件，携带value值为：', e.detail.value)
    console.log(e.detail.value)
    id = e.detail.value

  },
  addTitle(e) {
    console.log(e.detail.value);
    title = e.detail.value
  },
  addDes(e) {
    console.log(e.detail.value);
    des = e.detail.value
  },
  addAddr(e) {
    console.log(e.detail.value);
    addr = e.detail.value
  },
  addPrice(e) {
    console.log(e.detail.value);
    price = e.detail.value
  },
  addTell(e) {
    console.log(e.detail.value);
    tell = e.detail.value
  },
  chooseImg(){
    let that=this
    wx.chooseImage({
      count: 6,
      sizeType: ['original', 'compressed'],
      sourceType: ['album', 'camera'],
      success(res) {
        console.log(res)
        pic = res.tempFilePaths
        that.setData({
          pic
        })
      }
    })
  },

  addData() {
    DB.add({
      data: {
        id:id,
        title:title,
        addr:addr,
        des:des,
        price:price,
        tell:tell,
        cllection : 0,
        comment : 0,
        date : new Date(),
        pic : pic
      },
      success(res){
        console.log("成功",res)
      },
      fail(res){
        console.log("失败",res)
      }
    })
    wx.switchTab({
      url: '../index/index',  //注意switchTab只能跳转到tab页面，不能跳转到不带tab的页面
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