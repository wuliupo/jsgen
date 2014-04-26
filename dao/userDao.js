'use strict';
/*global require, module, Buffer, jsGen*/

/*
用户数据 mongodb 访问层
convertID(id); 用户显示Uid与MongoDB内部_id之间的转换;
getUsersNum(callback); 获取用户总数量;
getUsersIndex(callback); 获取所有用户的{_id:_id,name:name,email:email}，用于内存缓存以便快速索引;
getLatestId(callback); 获取最新注册用户的_id;
getAuth(_id, callback); 根据_id获取对应用户的认证数据;
getSocial(_id, callback); 根据_id获取对应用户的社交媒体认证数据（weibo\qq\google\baidu）;
getUserInfo(_id, callback); 根据_id获取对应用户详细信息;
setUserInfo(userObj, callback); 批量设置用户信息;
setLoginAttempt(userObj); 记录用户尝试登录的次数（未成功登录）;
setLogin(userObj); 记录用户成功登录的时间和IP;
setSocial(userObj, callback); 设置用户的社交媒体认证数据
setFans(userObj); 增加或减少用户粉丝;
setFollow(userObj, callback); 增加或减少用户关注对象;
setArticle(userObj, callback); 增加或减少用户主题;
setCollection(userObj, callback); 增加或减少用户合集;
setMark(userObj, callback); 增加或减少用户收藏;
setMessages(userObj); 增加或重置用户未读信息;
setReceive(userObj); 增加或减少用户接收的消息;
setSend(userObj); 增加或减少用户发送的消息;
setNewUser(userObj, callback); 注册新用户;
*/
var noop = jsGen.lib.tools.noop,
    union = jsGen.lib.tools.union,
    intersect = jsGen.lib.tools.intersect,
    UIDString = jsGen.lib.json.UIDString,
    defautUser = jsGen.lib.json.User,
    preAllocate = jsGen.lib.json.UserPre,
    callbackFn = jsGen.lib.tools.callbackFn,
    wrapCallback = jsGen.lib.tools.wrapCallback,
    converter = jsGen.lib.converter,
    users = jsGen.dao.db.bind('users');

users.bind({

    convertID: function (id) {
        switch (typeof id) {
        case 'string':
            id = id.substring(1);
            return converter(id, 26, UIDString);
        case 'number':
            id = jsGen.lib.converter(id, 26, UIDString);
            while (id.length < 5) {
                id = 'a' + id;
            }
            return 'U' + id;
        default:
            return null;
        }
    },

    getUsersNum: function (callback) {
        this.count(wrapCallback(callback));
    },

    getUsersIndex: function (callback) {
        callback = callback || callbackFn;
        this.find({}, {
            sort: {
                _id: -1
            },
            hint: {
                _id: 1
            },
            fields: {
                _id: 1,
                name: 1,
                email: 1,
                avatar: 1
            }
        }).each(callback);
    },

    getFullUsersIndex: function (callback) {
        callback = callback || callbackFn;
        this.find({}, {
            sort: {
                _id: -1
            },
            hint: {
                _id: 1
            }
        }).each(callback);
    },

    getLatestId: function (callback) {
        callback = callback || callbackFn;
        this.findOne({}, {
            sort: {
                _id: -1
            },
            hint: {
                _id: 1
            },
            fields: {
                _id: 1
            }
        }, callback);
    },

    getAuth: function (_id, callback) {
        this.findOne({
            _id: +_id
        }, {
            fields: {
                _id: 1,
                passwd: 1,
                resetKey: 1,
                resetDate: 1,
                loginAttempts: 1,
                locked: 1
            }
        }, wrapCallback(callback));
    },

    getSocial: function (_id, callback) {
        this.findOne({
            _id: +_id
        }, {
            fields: {
                name: 1,
                email: 1,
                social: 1
            }
        }, wrapCallback(callback));
    },

    getUserInfo: function (_id, callback) {
        this.findOne({
            _id: +_id
        }, {
            fields: {
                passwd: 0,
                resetKey: 0,
                resetDate: 0,
                loginAttempts: 0,
                login: 0,
                allmsg: 0
            }
        }, wrapCallback(callback));
    },

    setUserInfo: function (userObj, callback) {
        var setObj = {},
            newObj = {
                name: '',
                email: '',
                passwd: '',
                resetKey: '',
                resetDate: 0,
                locked: false,
                sex: '',
                role: 0,
                avatar: '',
                desc: '',
                score: 0,
                readtimestamp: 0,
                tagsList: [0]
            };

        newObj = intersect(newObj, userObj);
        setObj.$set = newObj;
        if (callback) {
            this.findAndModify({
                _id: userObj._id
            }, [], setObj, {
                w: 1,
                'new': true
            }, wrapCallback(callback));
        } else {
            this.update({
                _id: userObj._id
            }, setObj, noop);
        }
    },

    setLoginAttempt: function (userObj) {
        var setObj = {},
            newObj = {
                loginAttempts: 0
            };

        newObj = intersect(newObj, userObj);
        if (newObj.loginAttempts === 0) {
            setObj.$set = newObj;
        } else {
            setObj.$inc = {
                loginAttempts: 1
            };
        }

        this.update({
            _id: userObj._id
        }, setObj, noop);
    },

    setLogin: function (userObj) {
        var setObj = {},
            newObj = {
                lastLoginDate: 0,
                login: {
                    date: 0,
                    ip: ''
                }
            };

        newObj = intersect(newObj, userObj);
        setObj.$set = {
            lastLoginDate: newObj.lastLoginDate
        };
        setObj.$push = {
            login: newObj.login
        };
        this.update({
            _id: userObj._id
        }, setObj, noop);
    },

    setSocial: function (userObj, callback) {
        var setObj = {
            $set: {
                'social.weibo': {},
                'social.qq': {},
                'social.google': {},
                'social.baidu': {}
            }
        },
            newObj = {
                social: {
                    weibo: {
                        id: '',
                        name: ''
                    },
                    qq: {
                        id: '',
                        name: ''
                    },
                    google: {
                        id: '',
                        name: ''
                    },
                    baidu: {
                        id: '',
                        name: ''
                    }
                }
            };

        newObj = intersect(newObj, userObj);
        if (newObj.social.weibo) {
            setObj.$set['social.weibo'] = newObj.social.weibo;
        } else {
            delete setObj.$set['social.weibo'];
        }
        if (newObj.social.qq) {
            setObj.$set['social.qq'] = newObj.social.qq;
        } else {
            delete setObj.$set['social.qq'];
        }
        if (newObj.social.google) {
            setObj.$set['social.google'] = newObj.social.google;
        } else {
            delete setObj.$set['social.google'];
        }
        if (newObj.social.baidu) {
            setObj.$set['social.baidu'] = newObj.social.baidu;
        } else {
            delete setObj.$set['social.baidu'];
        }

        this.update({
            _id: userObj._id
        }, setObj, {
            w: 1
        }, wrapCallback(callback));
    },

    setFans: function (userObj) {
        var setObj = {},
            newObj = {
                fansList: 0
            };

        newObj = intersect(newObj, userObj);
        if (newObj.fansList < 0) {
            newObj.fansList = -newObj.fansList;
            setObj.$inc = {
                fans: -1
            };
            setObj.$pull = {
                fansList: newObj.fansList
            };
        } else {
            setObj.$inc = {
                fans: 1
            };
            setObj.$push = {
                fansList: newObj.fansList
            };
        }

        this.update({
            _id: userObj._id
        }, setObj, noop);
    },

    setFollow: function (userObj, callback) {
        var setObj = {},
            newObj = {
                followList: 0
            };

        newObj = intersect(newObj, userObj);
        if (newObj.followList < 0) {
            newObj.followList = -newObj.followList;
            setObj.$inc = {
                follow: -1
            };
            setObj.$pull = {
                followList: newObj.followList
            };
        } else {
            setObj.$inc = {
                follow: 1
            };
            setObj.$push = {
                followList: newObj.followList
            };
        }

        this.update({
            _id: userObj._id
        }, setObj, {
            w: 1
        }, wrapCallback(callback));
    },

    setArticle: function (userObj, callback) {
        var setObj = {},
            newObj = {
                articlesList: 0
            };

        newObj = intersect(newObj, userObj);
        if (newObj.articlesList < 0) {
            newObj.articlesList = -newObj.articlesList;
            setObj.$inc = {
                articles: -1
            };
            setObj.$pull = {
                articlesList: newObj.articlesList
            };
        } else {
            setObj.$inc = {
                articles: 1
            };
            setObj.$push = {
                articlesList: newObj.articlesList
            };
        }

        this.update({
            _id: userObj._id
        }, setObj, {
            w: 1
        }, wrapCallback(callback));
    },

    setCollection: function (userObj, callback) {
        var setObj = {},
            newObj = {
                collectionsList: 0
            };

        newObj = intersect(newObj, userObj);
        if (newObj.collectionsList < 0) {
            newObj.collectionsList = -newObj.collectionsList;
            setObj.$inc = {
                collections: -1
            };
            setObj.$pull = {
                collectionsList: newObj.collectionsList
            };
        } else {
            setObj.$inc = {
                collections: 1
            };
            setObj.$push = {
                collectionsList: newObj.collectionsList
            };
        }

        this.update({
            _id: userObj._id
        }, setObj, {
            w: 1
        }, wrapCallback(callback));
    },

    setMark: function (userObj) {
        var setObj = {},
            newObj = {
                markList: 0
            };

        newObj = intersect(newObj, userObj);
        if (newObj.markList < 0) {
            newObj.markList = -newObj.markList;
            setObj.$pull = {
                markList: newObj.markList
            };
        } else {
            setObj.$push = {
                markList: newObj.markList
            };
        }

        this.update({
            _id: userObj._id
        }, setObj, noop);
    },

    setMessages: function (userObj) {
        var setObj = {},
            newObj = {
                unread: {},
                allmsg: {}
            };

        newObj = intersect(newObj, userObj);
        setObj.$push = {
            unread: newObj.unread,
            allmsg: newObj.allmsg
        };

        this.update({
            _id: userObj._id
        }, setObj, noop);
    },

    delMessages: function (userObj) {
        var setObj = {},
            newObj = {
                unread: {},
                allmsg: {}
            };

        newObj = intersect(newObj, userObj);
        if (newObj.receiveList < 0) {
            newObj.receiveList = -newObj.receiveList;
            setObj.$pull = {
                receiveList: newObj.receiveList
            };
        } else {
            setObj.$push = {
                receiveList: newObj.receiveList
            };
        }

        this.update({
            _id: userObj._id
        }, setObj, noop);
    },

    setReceive: function (userObj) {
        var setObj = {},
            newObj = {
                receiveList: 0
            };

        newObj = intersect(newObj, userObj);
        if (newObj.receiveList < 0) {
            newObj.receiveList = -newObj.receiveList;
            setObj.$pull = {
                receiveList: newObj.receiveList
            };
        } else {
            setObj.$push = {
                receiveList: newObj.receiveList
            };
        }

        this.update({
            _id: userObj._id
        }, setObj, noop);
    },

    setSend: function (userObj) {
        var setObj = {},
            newObj = {
                sendList: 0
            };

        newObj = intersect(newObj, userObj);
        if (newObj.sendList < 0) {
            newObj.sendList = -newObj.sendList;
            setObj.$pull = {
                sendList: newObj.sendList
            };
        } else {
            setObj.$push = {
                sendList: newObj.sendList
            };
        }

        this.update({
            _id: userObj._id
        }, setObj, noop);
    },

    setNewUser: function (userObj, callback) {
        var that = this,
            user = union(defautUser),
            newUser = union(defautUser);
        callback = callback || callbackFn;

        newUser = intersect(newUser, userObj);
        newUser = union(user, newUser);
        newUser.date = Date.now();
        newUser.lastLoginDate = newUser.date;
        newUser.readtimestamp = newUser.date;

        this.getLatestId(function (err, doc) {
            if (err) {
                return callback(err, null);
            }
            if (!doc) {
                preAllocate._id = newUser._id || 1;
            } else {
                preAllocate._id = doc._id + 1;
            }
            delete newUser._id;
            that.insert(
                preAllocate, {
                    w: 1
                }, function (err, doc) {
                    if (err) {
                        return callback(err, doc);
                    }
                    that.findAndModify({
                        _id: preAllocate._id
                    }, [], newUser, {
                        w: 1,
                        'new': true
                    }, wrapCallback(callback));
                });
        });
    }
});

module.exports = {
    convertID: users.convertID,
    getUsersNum: users.getUsersNum,
    getUsersIndex: users.getUsersIndex,
    getFullUsersIndex: users.getFullUsersIndex,
    getLatestId: users.getLatestId,
    getAuth: users.getAuth,
    getSocial: users.getSocial,
    getUserInfo: users.getUserInfo,
    setUserInfo: users.setUserInfo,
    setLoginAttempt: users.setLoginAttempt,
    setLogin: users.setLogin,
    setSocial: users.setSocial,
    setFans: users.setFans,
    setFollow: users.setFollow,
    setArticle: users.setArticle,
    setCollection: users.setCollection,
    setMark: users.setMark,
    setMessages: users.setMessages,
    setReceive: users.setReceive,
    setSend: users.setSend,
    setNewUser: users.setNewUser
};