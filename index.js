var log = require('logger')('mongutils');
var nconf = require('nconf');
var mongoose = require('mongoose');
var _ = require('lodash');
var maps = require('@google/maps');
var Schema = mongoose.Schema;
var validators = require('validators');
var types = validators.types;
var values = validators.values;
var hybrids = validators.hybrids;

var mapClient = maps.createClient({
  key: nconf.get('GOOGLE_KEY')
});

module.exports = function (schema, options) {
  schema.virtual('id').get(function () {
    return String(this._id);
  });

  schema.set('toJSON', {
    getters: true,
    transform: function (doc, ret, options) {
      delete ret._id;
      delete ret.__v;
    }
  });

  schema.statics.createIt = function (options, ctx, done) {
    validators.createIt(options, ctx, done)
  };

  schema.statics.updateIt = function (req, res, data, next) {
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
      hybrid: hybrids.permissions(),
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

module.exports.createdAt = function (o) {
  o = o || {};
  return function (schema, options) {
    schema.add({
      createdAt: {
        type: Date,
        default: Date.now,
        server: true,
        searchable: true,
        sortable: true,
        value: values.createdAt(),
        expires: o.expires
      }
    });
  };
};

module.exports.updatedAt = function (o) {
  o = o || {};
  return function (schema, options) {
    schema.add({
      updatedAt: {
        type: Date,
        default: Date.now,
        server: true,
        searchable: true,
        sortable: true,
        expires: o.expires
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
};

module.exports.tags = function (options) {
  var value = {};
  var validator = {};
  var fields = Object.keys(options);
  fields.forEach(function (field) {
    var tagger = options[field];
    value[field] = tagger.value;
    validator[field] = tagger.validator;
  });
  return function (schema, options) {
    schema.add({
      tags: {
        type: [{
          _id: false,
          name: String,
          value: String
        }],
        default: [],
        server: true,
        searchable: true,
        validator: types.tags(validator),
        value: values.tags(value)
      }
    });
  };
};