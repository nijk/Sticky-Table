/**
 * jquery.stickytable.js
 * Copyright 2012 Nick Aspinall
 * Licensed under the MIT license.
 */

/*
 * STICKYTABLE
 *
 * .stickytable( [object] )            Returns jQuery
 *
 * Dependencies:
 *
 * jquery.stickytable.js is dependent on jQuery (1.4.3),
 * optional reliance is on jquery.smartresize.js
 *
 * Description: Fix a table header or footer to the top/bottom of the screen when that content is scrolled out of view
 *
 * Example use:
 *
 * var sticky_options = {
 *     "stick_header": true,
 *     "stick_footer": true,
 *     "offset_height":20,
 *     "original_header_class_name":"org-h",
 *     "original_footer_class_name":"org-f",
 *     "cloned_header_class_name":"sticky-h",
 *     "cloned_footer_class_name":"sticky-f"
 * };
 *
 *
 * $(document).ready(function () {
 *     $("table").stickytable(sticky_options);
 * });
 *
 * Known issues:
 *
 * 1. Resizing the window seems to throw out the calculation for rolling sticky header
 *
 *
 */


/**
 * Todo:
 *  1. Fix resizing issue with rolling sticky header
 *  2. Test all option variations
 *  3. Test X-Browser (Mac: FF, GC, Safari), (PC: FF, GC, IE7/8/9)
 */
;
(function ($) {

    $.fn.stickytable = function(options){
        //Set up global properties for the class
        var _jq = this;
        var $this;
        _jq.settings = {};
        _jq.table = {};

        //Create defaults for the plugin to fallback on if no overrides are passed in the options argument (object)
        var defaults = {
            "stick_header": true,
            "stick_footer": false,
            "offset_height":0,
            "original_header_class_name":"original-header",
            "original_footer_class_name":"original-footer",
            "cloned_header_class_name":"sticky-header",
            "cloned_footer_class_name":"sticky-footer"
        };

        //Create settings from defaults with overridden values from the options object passed to the plugin
        _jq.settings = $.extend({}, defaults, options);

        /**
         * Initialise the sticky header behaviour
         *
         * @param table
         */
        _jq.init = function(table){
            //Only run _setup() method if it has not been run for this <table> before
            if(undefined == $(table).data("$sticky_header")){
                _setup(table);
            }

            //Handle to scroll event, obtain the scrollTop value and call the _scroll() method.
            $(window).scroll(function(e){
                var scrollTop = $(window).scrollTop();
                _scroll(scrollTop, table);
            }).trigger("scroll");
        };

        //Private methods
        /**
         * One time run of this private method will setup the sticky headers and
         * initialise any positioning required if the page is already scrolled.
         *
         * @param table
         */
        var _setup = function(table){
            _set_table_scope(table);
            _set_objects(table);
            _get_dimensions(table);
            _resize_columns(table);
            _set_styling(table);

            //Create initial scroll if page is not at top on first load
            var initial_scrollTop = $(window).scrollTop();
            if (initial_scrollTop > 0) {
                _scroll(initial_scrollTop, table);
            }

            if('function' == typeof $(window).smartresize){
                $(window).smartresize(function(){
                    _do_resize(table);
                });
            }else{
                $(window).resize(function(){
                    _do_resize(table);
                });
            }
        };

        /**
         * Packages resizing functions calls together so that either resize()
         * or other custom events can call a resize on the table
         *
         * @param table
         */
        var _do_resize = function(table){
            _set_table_scope(table);
            _get_dimensions(table);
            _resize_columns(table);
            _set_styling(table);
            _scroll($(window).scrollTop(), table);
        };


        var _set_table_scope = function(table){
            //Cache the current <table> jQuery object for quicker DOM traversal
            $this = $(table);
        };

        var _set_objects = function(table){
            if(true === _jq.settings.stick_header){
                //Save jQuery objects (for later use) in the parent <table>
                $(table).data("$header", $("thead", $this));

                //$header_clone is the jQuery object used for manipulation BEFORE it is inserted into the DOM.
                _jq.$header_clone = $(table).data("$header").clone(true);
                _jq.$header_clone.addClass(_jq.settings.cloned_header_class_name);

                //$header is the original <thead> jQuery object from which a clone has been taken
                $(table).data("$header").addClass(_jq.settings.original_header_class_name).after(_jq.$header_clone);

                //$sticky_header is the jQuery object which refers to the cloned <thead> in the DOM
                $(table).data("$sticky_header", $(table).data("$header").siblings("." + _jq.settings.cloned_header_class_name));
            }
            if(true === _jq.settings.stick_footer){
                //Save jQuery objects (for later use) in the parent <table>
                $(table).data("$footer", $("tfoot", $this));

                //$footer_clone is the jQuery object used for manipulation BEFORE it is inserted into the DOM.
                _jq.$footer_clone = $(table).data("$footer").clone(true);
                _jq.$footer_clone.addClass(_jq.settings.cloned_footer_class_name);

                //$footer is the original <tfoot> jQuery object from which a clone has been taken
                $(table).data("$footer").addClass(_jq.settings.original_footer_class_name).after(_jq.$footer_clone);

                //$sticky_header is the jQuery object which refers to the cloned <thead> in the DOM
                $(table).data("$sticky_footer", $(table).data("$footer").siblings("." + _jq.settings.cloned_footer_class_name));
            }
        };


        var _get_dimensions = function(table){
            if(true === _jq.settings.stick_header){
                //Store useful values from <thead> elements
                $(table).data("header_outer_height", $(table).data("$header").outerHeight());
                $(table).data("header_width", $(table).data("$header").width());
                $(table).data("header_offset", $(table).data("$header").offset());
                $(table).data("sticky_header_outer_height", $(table).data("$sticky_header").outerHeight());
                $(table).data("sticky_header_offset", $(table).data("$sticky_header").offset());
            }
            if(true === _jq.settings.stick_footer){
                //Store useful values from <tfoot> elements
                $(table).data("footer_outer_height", $(table).data("$footer").outerHeight());
                $(table).data("footer_width", $(table).data("$footer").width());
                $(table).data("footer_offset", $(table).data("$footer").offset());
                $(table).data("sticky_footer_outer_height", $(table).data("$sticky_footer").outerHeight());
                $(table).data("sticky_footer_offset", $(table).data("$sticky_footer").offset());
            }

            //Find the last row of the table - $last_row defines where Rolling Sticky Header will kick in
            $(table).data("$last_row", $("> tbody > tr:last", $this));
            $(table).data("last_row_offset", $(table).data("$last_row").offset());
            $(table).data("last_row_height", $(table).data("$last_row").outerHeight());
        };

        /**
         * Sets the css for the cloned <thead> and/or <tfoot> so that they are correctly positioned and hidden
         *
         * @param table
         */
        var _set_styling = function(table) {
            if(true === _jq.settings.stick_header){
                $(table).data("$sticky_header").css({
                    "position":"fixed",
                    "top":$(table).data("header_offset").top,
                    "overflow":"hidden",
                    "width":$(table).data("header_width"),
                    "display":"none",
                    "z-index":100
                });
            }
            if(true === _jq.settings.stick_footer){
                $(table).data("$sticky_footer").css({
                    "position":"fixed",
                    "top":$(table).data("footer_offset").top,
                    "overflow":"hidden",
                    "width":$(table).data("footer_width"),
                    "display":"none",
                    "z-index":90
                });
            }
        };

        /**
         * Gets the widths from the <th>/<td> elements in the original <thead>/<tfoot>
         * and sets the widths in the cloned <thead>/<tfoot> so that both headers/footers look the same
         *
         * @param table
         */
        var _resize_columns = function(table) {
            if(true === _jq.settings.stick_header){
                $("th", $(table).data("$header")).each(function (index, element) {
                    var $sticky_header_children = $("th", $(table).data("$sticky_header"));
                    var $sticky_header_child = $sticky_header_children.eq(index);
                    $sticky_header_child.outerWidth($(element).outerWidth());
                });
            }
            if(true === _jq.settings.stick_footer){
                $("td", $(table).data("$footer")).each(function (index, element) {
                    var $sticky_footer_children = $("td", $(table).data("$sticky_footer"));
                    var $sticky_footer_child = $sticky_footer_children.eq(index);
                    $sticky_footer_child.outerWidth($(element).outerWidth());
                });
            }
        };

        /**
         * Handles scrollTop values coming from the scroll() event handler
         * and sends them to the required _scroll_header() and/or _scroll_footer() methods
         *
         * @param scrollTop
         * @param table
         */
        var _scroll = function(scrollTop, table) {
            if(true === _jq.settings.stick_header){
                _scroll_header(scrollTop, table);
            }
            if(true === _jq.settings.stick_footer){
                _scroll_footer(scrollTop, table);
            }
        };

        var _default_scroll = function($org_elem, $sticky_elem){
            //Reset sticky behaviour so that sticky header/footer is hidden and the original header/footer is restored
            $org_elem.css({"visibility":"visible"});
            $sticky_elem.hide();
        };


        /**
         * Handles scrollTop values coming from the _scroll() method
         * then calculates and sets css positioning for $sticky_header
         *
         * @param scrollTop
         * @param table
         */
        var _scroll_header = function(scrollTop, table){
            var position = "fixed";
            var stop = 0;
            var offset = _jq.settings.offset_height;
            var header_offset_top = $(table).data("header_offset").top;
            var header_height = $(table).data("header_outer_height");
            var sticky_header_height = $(table).data("sticky_header_outer_height");
            var last_row_height = $(table).data("last_row_height");
            var last_row_offset_top = $(table).data("last_row_offset").top;

            //Determine where the header should be positioned
            if((scrollTop + offset > header_offset_top) && scrollTop + offset + header_height < last_row_offset_top - sticky_header_height){
                stop = offset;
                $(table).data("$header").css({"visibility":"hidden"});
                $(table).data("$sticky_header").show();
            }else if(scrollTop + offset + header_height >= last_row_offset_top - sticky_header_height){
                position = "absolute";
                stop = last_row_offset_top - header_height - sticky_header_height;
            }else{
                _default_scroll($(table).data("$header"), $(table).data("$sticky_header"));
            }
            $(table).data("$sticky_header").css({"position":position, "top":stop + "px"});
        };


        /**
         * Handles scrollTop values coming from the _scroll() method
         * then calculates and sets css positioning for $sticky_footer
         *
         * @param scrollTop
         * @param table
         */
        var _scroll_footer = function(scrollTop, table){
            //Footer jQuery objects
            var $footer = $(table).data("$footer");
            var $sticky_footer = $(table).data("$sticky_footer");

            //Store values for footer calculations and placement
            var position = "fixed";
            var stop = 0;
            var viewport_height = $(window).height();
            var tbody_height = $("tbody", table).outerHeight();
            var footer_height = $(table).data("footer_outer_height");
            var table_height = tbody_height + footer_height;
            //Add the header_height to the table_height if stick_headers is set to true
            if(true === _jq.settings.stick_header){
                table_height += $(table).data("header_outer_height");
            }
            var table_offset = $(table).offset();
            var sticky_footer_height = $(table).data("sticky_footer_outer_height");
            var last_row_offset_bottom = $(table).data("last_row_offset").top + $(table).data("last_row_height");

            //Check that tbody is taller than the viewport and the table is scrolled into view
            if(table_height > viewport_height && scrollTop > table_offset.top){
                //Check that the table is fully in the viewport
                if(table_height - (scrollTop - table_offset.top) > viewport_height && last_row_offset_bottom - scrollTop > viewport_height - sticky_footer_height){
                    stop = viewport_height - sticky_footer_height;
                    $(table).data("$footer").css({"visibility":"hidden"});
                    $(table).data("$sticky_footer").show();
                }else{
                    _default_scroll($footer, $sticky_footer);
                }
            }else{
                _default_scroll($footer, $sticky_footer);
            }
            $(table).data("$sticky_footer").css({"position":position, "top":stop + "px"});
        };

        return this.each(function(i, table){
            _jq.init(table);
        });
    };
})(jQuery);