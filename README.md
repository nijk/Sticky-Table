# jQuery Sticky Table - Sticky headers and footers
#### `.stickytable([options])`
#### **Returns** *jQuery*

Dependencies
------------
* jquery.stickytable.js is dependent on jQuery (1.4.3)
* optional reliance is on [jquery.smartresize.js](https://github
.com/louisremi/jquery-smartresize)

Description
-----------
Fix a table header or footer to the top/bottom of the screen when that content
is scrolled out of view

Example use
-----------
```javascript
var sticky_options = {
    "stick_header": true,
    "stick_footer": true,
    "offset_height":20,
    "original_header_class_name":"org-h",
    "original_footer_class_name":"org-f",
    "cloned_header_class_name":"sticky-h",
    "cloned_footer_class_name":"sticky-f"
};

$(document).ready(function () {
    $("table").stickytable(sticky_options);
});
```

Known issues
------------
1. Resizing the window seems to throw out the calculation for rolling sticky
header

License
-------
Licensed under the MIT license.
Copyright (c) 2012 [Nick Aspinall](http://codenamenick.co.uk).