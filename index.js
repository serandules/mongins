var log = require('logger')('mongutils');
var mongoose = require('mongoose');
var ObjectID = require('mongodb').ObjectID;
var _ = require('lodash');
var Schema = mongoose.Schema;
var validators = require('validators');
var types = validators.types;
var values = validators.values;

var public;

module.exports = function (schema, options) {
    schema.statics.createIt = function (req, res, data, next) {
        this.create(data, next);
    };

    schema.statics.updateIt = function (req, res, data, next) {
        var token = req.token;
        var current = req.current;
        var allowed = data.allowed || [];
        var entry = _.find(allowed, function (o) {
            return o.user === token.user.id;
        });
        // TODO here user cannot remove permissions for himself
        var perms = entry.perms || current.perms;
        if (perms.indexOf('read') === -1) {
            perms.push('read');
        }
        if (perms.indexOf('update') === -1) {
            perms.push('update');
        }
        if (perms)
        data.allowed = [{
            user: user,
            perms: ['read', 'update', 'delete']
        }, {
            group: public,
            perms: ['read']
        }];
        this.update(data, next);
    };

    schema.add({
        allowed: {
            type: [{
                _id: false,
                user: Schema.Types.ObjectId,
                group: Schema.Types.ObjectId,
                perms: [String]
            }],
            default: [],
            searchable: true,
            validator: types.allowed({
                perms: ['read', 'update', 'delete']
            }),
            value: values.allowed({
                perms: ['read', 'update', 'delete']
            })
        }
    });
};

module.exports.user = function (schema, options) {
    schema.add({
        user: {
            type: Schema.Types.ObjectId,
            ref: 'users',
            validator: types.ref(),
            server: true,
            required: true,
            searchable: true,
            value: values.user()
        }
    });
};

module.exports.createdAt = function (schema, options) {
    schema.add({
        createdAt: {
            type: Date,
            default: Date.now,
            server: true,
            searchable: true,
            sortable: true,
            value: values.createdAt()
        }
    });
};

module.exports.updatedAt = function (schema, options) {
    schema.add({
        updatedAt: {
            type: Date,
            default: Date.now,
            server: true,
            searchable: true,
            sortable: true
        }
    });
    schema.pre('validate', function (next) {
        this.updatedAt = new Date();
        next();
    });
    schema.pre('update', function (next) {
        this.updatedAt = new Date();
        next();
    });
};