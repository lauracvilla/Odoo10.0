odoo.define('tree_search_with_range.tree', function (require) {
"use strict";

var time = require('web.time');
var core = require('web.core');
var data = require('web.data');
var session = require('web.session');
var utils = require('web.utils');
var Model = require('web.Model');
var ListView = require('web.ListView');
var datepicker = require('web.datepicker');
var ViewManager = require('web.ViewManager');
var _t = core._t;
var _lt = core._lt;
var QWeb = core.qweb;

ListView.include({

    init: function(parent, dataset, view_id, options) {
        this._super.apply(this, arguments);
        this.ts_context = dataset.context.tree_search;
        this.fields_range = dataset.context.fields_range;
        this.ts_fields = [];
    },

    get_data: function() {
        var l10n = _t.database.parameters;
        var datepickers = {
            pickTime: true,
            useSeconds: true,
            startDate: moment({ y: 1900 }),
            endDate: moment().add(200, "y"),
            calendarWeeks: true,
            icons : {
                time: 'fa fa-clock-o',
                date: 'fa fa-calendar',
                up: 'fa fa-chevron-up',
                down: 'fa fa-chevron-down'
               },
            language : moment.locale(),
            format : time.strftime_to_moment_format(l10n.date_format +' '+ l10n.time_format),
        }
        return datepickers;
    },

    render_buttons: function($node) {
        var self = this;
        this._super.apply(this, arguments);
        var datepickers_opt = this.get_data();

        self.$buttons.find('.search-range').remove();

        // for date
        var search_fields = [];
        _.each(self.columns, function(value, key, list){
            if (value.store && value.type === "datetime" || value.type === "date") {
                search_fields.push([value.name, value.string]);
            }
        });
        if (search_fields.length > 0) {
            self.$search_date = $(QWeb.render('buttons_for_date', {'search_fields': search_fields}))
            self.$search_date.find('.field_start_date').datetimepicker(datepickers_opt);
            self.$search_date.find('.field_end_date').datetimepicker(datepickers_opt);

            self.$search_date.find('.field_start_date').on('change', function() {
                self.search_by_range();
            });
            self.$search_date.find('.field_end_date').on('change', function() {
                self.search_by_range();
            });
            self.$search_date.find('.select_field_date').on('change', function() {
                self.search_by_range();
            });
            self.$search_date.appendTo(self.$buttons);
        }

        // for int & float
        search_fields = [];
        _.each(self.columns, function(value, key, list){
            if (value.string && value.string.length > 1 && value.store && (value.type === "integer" || value.type === "float" || value.type === "monetary")) {
                search_fields.push([value.name, value.string]);
            }
        });

        if (search_fields.length == 0) {
            if (self.fields_range) {
                search_fields = self.fields_range;
            }
        }

        if (search_fields.length > 0) {
            self.$search_int = $(QWeb.render('button_for_int', {'search_fields': search_fields}))
            self.$search_int.find('.select_field_int').on('change', function() {
                self.search_by_range();
            });
            self.$search_int.find('.field_start_int').on('change', function() {
                self.search_by_range();
            });
            self.$search_int.find('.field_end_int').on('change', function() {
                self.search_by_range();
            });
            self.$search_int.appendTo(self.$buttons);
        }
    },

    do_search: function(domain, context, group_by) {
        var self = this;
        this.last_domain = domain;
        this.last_context = context;
        this.last_group_by = group_by;
        this.last_search = _.bind(this._super, this);
        return self.search_by_range();
    },

    js_date: function (now) {
        //format: yyyyMMddhhmmss
	    var year = "" + now.getFullYear();
	    var month = "" + (now.getMonth() + 1); if (month.length == 1) { month = "0" + month; }
	    var day = "" + now.getDate(); if (day.length == 1) { day = "0" + day; }
	    var hour = "" + now.getHours(); if (hour.length == 1) { hour = "0" + hour; }
	    var minute = "" + now.getMinutes(); if (minute.length == 1) { minute = "0" + minute; }
	    var second = "" + now.getSeconds(); if (second.length == 1) { second = "0" + second; }
	    return year + "-" + month + "-" + day + " " + hour + ":" + minute + ":" + second;
    },

    search_by_range: function() {
        var self = this;
        var domain = [], value, value_tmp;
        if (self.$search_date) {
            var start_date  = self.$search_date.find('.field_start_date').val(),
                end_date    = self.$search_date.find('.field_end_date').val(),
                field       = self.$search_date.find('.select_field_date').val();

            var l10n = _t.database.parameters;
            if (start_date) {
                var d = new Date(start_date);
                var nowUtc = new Date( d.getTime() + (d.getTimezoneOffset() * 60000));
                start_date = self.js_date(nowUtc);
                domain.push([field, '>=', start_date]);
            }
            if (end_date) {
                var d = new Date(end_date);
                var nowUtc = new Date( d.getTime() + ((d.getTimezoneOffset() + (24 * 60)) * 60000));
                end_date = self.js_date(nowUtc);
                domain.push([field, '<=', end_date]);
            }

        }

        if (self.$search_int) {
            var start_int  = self.$search_int.find('.field_start_int').val(),
                end_int    = self.$search_int.find('.field_end_int').val(),
                field_int  = self.$search_int.find('.select_field_int').val();
            if (start_int) {
                domain.push([field_int, '>=', parseInt(start_int)]);
            }
            if (end_int) {
                domain.push([field_int, '<=', parseInt(end_int)]);
            }
        }
        var domains = new data.CompoundDomain(self.last_domain, domain);
        self.dataset.domain = domains.eval();
        return self.last_search(domains, self.last_context, self.last_group_by);
    },
});

});
