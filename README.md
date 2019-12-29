# life798-node-moudle-coolq-plugin
## **使用request模块来对生活798的API进行访问的node-coolq-robot插件**
### **A node-coolq-robot plugin that uses request module to access API of life798**
让你在寝室的QQ群里接开水，不需要找卡，反复登录账号

核心上，这个项目提供了一个接入API的封装模块

以支持多用户多卡，一个小号一个插件接入多个群

#### 作者：PillarsZhang
#### *该插件的开发为非营利个人行为，如有不妥请及时联系本人*

# 文件介绍
  - life798.js 封装了对API接口的基础操作，可以作为独立moudle
  - settings.example.js 设置的模板
  - test.js 独立于node-coolq-robot的测试代码
  - index.js 接入node-coolq-robot

# 安装概要
  - 我所使用的node-coolq环境：
    - [richardchien/coolq-http-api](https://github.com/richardchien/coolq-http-api)
    - [CaoMeiYouRen/node-coolq-robot](https://github.com/CaoMeiYouRen/node-coolq-robot)
  - 调试过程需要在在node-coolq-robot目录下执行`npm install request`
  - 将插件文件夹解压至`node-coolq-robot\src\app\life798-node-moudle-coolq-plugin`
  - 在`settings.example.js`中，配置好账号群号等。将文件**重命名**为`settings.js`

# 操作逻辑
  - 运行`node test.js`可直接进入命令行调试模式
    - login 登录
    - query 查询收藏的机器和卡号
    - balance 查询余额
    - start 开始放水
    - end 停止放水
  - 在可用群里，交互流程如下
    - 输入“热水”即可唤醒
    - 按提示输入编号，自动开始放水
    - 登出时输入“结束”或“停止”等结束关键词，也可以在机器上退卡，插件会自动结算
    - 在任何情况下都可以输入“冷水”初始所有操作，包括停止可能开启的机器。
# 更多期待
  - [ ] 支持添加机器
  - [x] 兼容多群多账户