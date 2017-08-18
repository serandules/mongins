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
    schema.virtual('id').get(function () {
        return this._id;
    });

    schema.set('toJSON', {
        getters: true,
        transform: function (doc, ret, options) {
            delete ret._id;
            delete ret.__v;
        }
    });

    schema.statics.createIt = function (req, res, data, next) {
        this.create(data, next);
    };

    schema.statics.updateIt = function (req, res, data, next) {
        var token = req.token;
        var current = req.current;
        var permissions = data.permissions || [];
        var entry = _.find(permissions, function (o) {
            return o.user === token.user.id;
        });
        // TODO here user cannot remove permissions for himself
        var actions = entry.actions || current.actions;
        if (actions.indexOf('read') === -1) {
            actions.push('read');
        }
        if (actions.indexOf('update') === -1) {
            actions.push('update');
        }
        if (actions)
        data.permissions = [{
            user: user,
            actions: ['read', 'update', 'delete']
        }, {
            group: public,
            actions: ['read']
        }];
        this.update(data, next);
    };

    schema.add({
        permissions: {
            type: [{
                _id: false,
                user: Schema.Types.ObjectId,
                group: Schema.Types.ObjectId,
                actions: [String]
            }],
            default: [],
            searchable: true,
            validator: types.permissions({
                actions: ['read', 'update', 'delete']
            }),
            value: values.permissions({
                actions: ['read', 'update', 'delete']
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