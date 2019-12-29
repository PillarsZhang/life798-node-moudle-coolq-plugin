module.exports = class settings {
    static username = '15000000008'; //测试时账号
    static password = '1000000m'; //测试时密码
    static stopWords = ['结束', '退卡', '停止', '退出', '停下', '停', 'end', 'stop', 'exit', 'return']; //停止关键词

    /* 支持多个群共享一个账户，也支持独立账户 */

    //生活798账户列表
    static accountList = [
        {
            username: '15000000008', //用户名
            password: '1000000m' //密码
        },
        {
            username: '13000000005',
            password: '2000000m'
        }
    ]

    //QQ群列表
    static groupList = [
        {
            groupNumber: 640000003, //群号
            master: 1000000009, //主管
            account: '15000000008' //生活798用户名
        },
        {
            groupNumber: 900000000,
            master: 2000000009,
            account: '13000000005'
        }
    ];
}