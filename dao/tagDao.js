'use strict';
/*global require, module, Buffer, jsGen*/

/*
    convertID(id);
    getTagsNum(callback);
    getLatestId(callback);
    getTagsList(_idArray, callback);
    getTag(_id, callback);
    setTag(tagObj, callback);
    setNewTag(tagObj, callback);
    delTag(_idArray, callback);
 */
var noop = jsGen.lib.tools.noop,
    union = jsGen.lib.tools.union,
    intersect = jsGen.lib.tools.intersect,
    IDString = jsGen.lib.json.IDString,
    defautTag = jsGen.lib.json.Tag,
    callbackFn = jsGen.lib.tools.callbackFn,
    wrapCallback = jsGen.lib.tools.wrapCallback,
    converter = jsGen.lib.converter,
    tags = jsGen.dao.db.bind('tags');

tags.bind({

    convertID: function (id) {
        switch (typeof id) {
        case 'string':
            id = id.substring(1);
            return converter(id, 62, IDString);
        case 'number':
            id = converter(id, 62, IDString);
            while (id.length < 3) {
                id = '0' + id;
            }
            return 'T' + id;
        default:
            return null;
        }
    },

    getTagsNum: function (callback) {
        this.count(wrapCallback(callback));
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

    getTagsIndex: function (callback) {
        callback = callback || callbackFn;
        this.find({}, {
            sort: {
                _id: 1
            },
            hint: {
                _id: 1
            },
            fields: {
                _id: 1,
                tag: 1,
                articles: 1,
                users: 1
            }
        }).each(callback);
    },

    getTag: function (_id, callback) {
        this.findOne({
            _id: +_id
        }, {
            sort: {
                _id: -1
            },
            fields: {
                tag: 1,
                articles: 1,
                articlesList: 1,
                users: 1,
                usersList: 1
            }
        }, wrapCallback(callback));
    },

    setTag: function (tagObj, callback) {
        var setObj = {},
            newObj = {
                tag: '',
                articlesList: 0,
                usersList: 0
            };

        newObj = intersect(newObj, tagObj);
        if (newObj.tag) {
            setObj.$set = {
                tag: newObj.tag
            };
        } else if (newObj.articlesList) {
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
        } else if (newObj.usersList) {
            if (newObj.usersList < 0) {
                newObj.usersList = -newObj.usersList;
                setObj.$inc = {
                    users: -1
                };
                setObj.$pull = {
                    usersList: newObj.usersList
                };
            } else {
                setObj.$inc = {
                    users: 1
                };
                setObj.$push = {
                    usersList: newObj.usersList
                };
            }
        }

        if (callback) {
            this.findAndModify({
                _id: tagObj._id
            }, [], setObj, {
                w: 1,
                'new': true
            }, wrapCallback(callback));
        } else {
            this.update({
                _id: tagObj._id
            }, setObj, noop);
        }
    },

    setNewTag: function (tagObj, callback) {
        var that = this,
            tag = union(defautTag),
            newTag = union(defautTag);
        callback = callback || callbackFn;

        newTag = intersect(newTag, tagObj);
        newTag = union(tag, newTag);

        this.getLatestId(function (err, doc) {
            if (err) {
                return callback(err, null);
            }
            if (!doc) {
                newTag._id = 1;
            } else {
                newTag._id = doc._id + 1;
            }
            that.findAndModify({
                _id: newTag._id
            }, [], newTag, {
                w: 1,
                upsert: true,
                'new': true
            }, wrapCallback(callback));
        });
    },

    delTag: function (_id, callback) {
        this.remove({
            _id: +_id
        }, {
            w: 1
        }, wrapCallback(callback));
    }
});

module.exports = {
    convertID: tags.convertID,
    getTagsNum: tags.getTagsNum,
    getLatestId: tags.getLatestId,
    getTagsIndex: tags.getTagsIndex,
    getTag: tags.getTag,
    setTag: tags.setTag,
    setNewTag: tags.setNewTag,
    delTag: tags.delTag
};