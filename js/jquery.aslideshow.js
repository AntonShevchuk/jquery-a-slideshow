/**
 * jQuery (a) SlideShow plugin
 *
 * Copyright (c) 2009, 2013 Anton Shevchuk
 * Released under the MIT license
 *
 * @author 	Anton Shevchuk AntonShevchuk@gmail.com
 * @version 1.0.0
 */
;(function($) {
    var defaults  = {
        width:320,      // width in px
        height:240,     // height in px
        index:0,        // start from frame number N
        time:3000,      // time out between slides
        history:false,  // change/check location hash
        title:true,     // show title
        titleShow:false,// always show title
        callback:null,  // callback function - call when slide changed - receive index and label
        panel:true,     // show controls panel
        play:false,     // play slide show
        loop:true,
        effect:'fade',  // available fade, scrollUp/Down/Left/Right, zoom, zoomFade, growX, growY
        effectTime:1000,// available fast,slow,normal and any valid fx speed value
        filter:true,    // remove <br/>, empty <div>, <p> and other stuff
        nextClick:false,      // bind content click next slide
        playClick:false,      // bind content click play/stop
        playHover:false,      // bind content hover play/stop
        playHoverr:false,     // bind content hover stop/play (reverse of playHover)
        playFrame:true,       // show frame "Play Now!"
        loadFrame:true,       // show frame with "loading"
        fullScreen:false,     // in full window size

        imageResize:false,      // resize image to slide show window
        imageZoom:true,         // zoom image to slide show window (for smaller side)
        imageCenter:true,       // set image to center
        imageAjax:true,         // load images from links
        imageLink:true,         // go to external link by click

        linkAjax:false,       // load html from links
        help:'Plugin homepage: <a href="http://slideshow.hohli.com">(a)Slideshow</a><br/>'+
             'Author homepage: <a href="http://anton.shevchuk.name">Anton Shevchuk</a>',

        controls :{         // show/hide controls elements
            'hide':true,    // show controls bar on mouse hover
            'first':true,   // go to first frame
            'prev':true,    // go to previous frame (if it first go to last)
            'play':true,    // play slide show
            'next':true,    // go to next frame (if it last go to first)
            'last':true,    // go to last frame
            'help':true,    // show help message
            'counter':true  // show slide counter
        }
    };

    // constructor of slideshow
    var slideShow = function(container, params) {
        /**
         * @type {jQuery}
         */
        this.$container = $(container);
        // mixin default options with custom settings
        this.options = $.extend({}, defaults, params);

        this.playId   = null;
        this.playFlag = false;
        this.playFrame = false;
        this.goToFlag = false;
        this.length   = 0;
        this.inited   = [];
        this.titles   = [];
        this.index = this.options.index;
    };

    /**
     * Build HTML of slides
     * @returns {boolean}
     */
    slideShow.prototype.build = function() {
        var _self = this;

        // filter content
        if (this.options.filter) {
            this.$container.find('br').remove();
            this.$container.find('p:empty').remove();
            this.$container.find('div:empty').remove();
        }

        // length equal to number of slides
        this.length = this.$container.children().length;

        // wrap children
        this.$container.children().wrap('<div class="aslideshow-slide"></div>');

        // prepare container
        this.$container.wrapInner('<div class="aslideshow"><div class="aslideshow-content"></div></div>');
        this.$slideshow = this.$container.children();

        // fullScreen
        if (this.options.fullScreen) {
            $('body').css({overflow:'hidden', padding:0});

            this.options.width  = $(window).width();
            this.options.height = ($(window).height()>$(document).height())?$(window).height():$(document).height();

            this.$slideshow.addClass('slideshow-fullScreen');
        }

        // build title
        if (this.options.title) {
            this.$slideshow.prepend('<div class="aslideshow-label-place"><div class="aslideshow-label aslideshow-opacity"></div></div>');

            this.$label = this.$slideshow.find('.aslideshow-label');

            if (!this.options.titleShow) {
                this.$slideshow.find('.aslideshow-label-place').hover(function(){
                    _self.$label.fadeIn();
                }, function() {
                    _self.$label.fadeOut();
                });
                this.$label.hide();
            }
            this.$slideshow.find('.aslideshow-label-place').css('width', this.options.width);
        }

        // build panel
        if (this.options.panel) {
            this.$slideshow.append('<div class="aslideshow-panel-place"><div class="aslideshow-panel aslideshow-opacity"></div></div>');
            panel = this.$slideshow.find('.aslideshow-panel');
            if (this.options.controls.first)
                panel.append('<a class="first button" href="#first">First</a>');

            if (this.options.controls.prev)
                panel.append('<a class="prev button"  href="#prev">Prev</a>');

            if (this.options.controls.play)
                panel.append('<a class="play button"  href="#play">Play</a>');

            if (this.options.controls.next)
                panel.append('<a class="next button"  href="#next">Next</a>');

            if (this.options.controls.last)
                panel.append('<a class="last button"  href="#last">Last</a>');

            if (this.options.controls.help) {
                panel.append('<a class="help button"  href="#help">Help</a>');
                panel.prepend('<div class="aslideshow-help">'+this.options.help+'</div>');
            }

            if (this.options.controls.counter) {
                panel.append('<span class="counter">'+(this.index+1)+' / '+this.length+'</span>');
            }

            if (this.options.controls.hide) {
                this.$slideshow.find('.aslideshow-panel-place').hover(function(){
                    $(this).find('.aslideshow-panel').fadeIn();
                }, function() {
                    $(this).find('.aslideshow-panel').fadeOut();
                });
                panel.hide();
            }

            this.$slideshow.find('.aslideshow-panel-place').css('width', this.options.width);
        }


        // Set Size Options
        this.$slideshow.css({width:this.options.width, height:this.options.height});

        var content = this.$slideshow.find('.aslideshow-content');
        content.css({width:this.options.width, height:this.options.height});

        // add playFrame
        if (this.options.playFrame) {
            this.playFrame = true;
            this.$slideshow.append('<div class="aslideshow-shadow aslideshow-opacity aslideshow-frame"><div></div></div>');
        }

        // add loadFrame
        if (this.options.loadFrame) {
            this.$slideshow.append('<div class="aslideshow-shadow aslideshow-opacity aslideshow-load"><div></div></div>');
        }
        this.$slideshow.find('.aslideshow-shadow').css({width:this.options.width, height:this.options.height});

        // bind all events
        this.bindEvents();

        // check play option
        if (this.options.play) {
            this.play();
        }

        // init slide (replace by ajax etc)
        this.initSlide(this.index);

        // show slide
        this.$slideshow.find('.aslideshow-slide:eq('+this.index+')').show();

        // update label
        this.updateLabel();

        // init checker
        if (this.options.history) {
            setInterval(function(){
                _self._check()
            }, 300);
        }

        return true;
    };
    slideShow.prototype.initSlide = function(index) {
        // initialize only ones
        for (var i = 0, loopCnt = this.inited.length; i < loopCnt; i++) {
            if (this.inited[i] === index) {
                return true;
            }
        }

        // index to initial stack
        this.inited.push(index);

        // current slide
        var slide = this.$slideshow.find('.aslideshow-slide:eq('+index+')');

        var _self = this;
        var title = '';
        var link  = false;
        var name  = slide.contents().attr('name');

        if (name != '') {
            var rename  = new RegExp("^((https?|ftp):\/\/)", "i");
            if (rename.test(name)) {
                link = name;
            }
        }

        /**
         * Replace A to content from HREF
         */
        if (slide.contents().is('a')) {
            var href   = slide.contents().attr('href');

            var domain = document.domain;
            domain = domain.replace(/\./i, "\.");  // for strong check domain name

            var reimage = new RegExp("\.(png|gif|jpg|jpeg|svg)$", "i");
            var relocal = new RegExp("^((https?:\/\/"+domain+")|(?!http:\/\/))", "i");

            title  = slide.contents().attr('title');
            if (title.length == 0) title = slide.contents().html();
            title  = title.replace(/\"/i,'\'');   // if you use single quotes for tag attribs

            if (this.options.imageAjax && reimage.test(href)) {

                var img = new Image();
                img.alt = title;

                this.imageLoad(img, href, index);

                slide.contents().replaceWith(img);
            } else if (this.options.linkAjax && relocal.test(href)) {
                $.get(href, function(data){
                    _self.goToSlide(index);
                    slide.contents().replaceWith('<div>'+data+'</div>');
                });
            } else {
                this.goToSlide(index); // why?
            }
        } else {
            if (slide.contents().is("img")) {
                /*if ($.browser.msie) { */
                var img = new Image();
                img.alt = slide.contents().attr("alt");

                this.imageLoad(img, slide.contents().attr("src"), index);

                slide.contents().replaceWith(img);
                /* } else {
                 this._load(slide.contents(), slide.contents().attr("src"), index);
                 } */
            } else {
                this.goToSlide(index);
            }

            if (slide.contents().attr('alt')) {
                title = slide.contents().attr('alt');
            } else if (slide.contents().attr('title')) {
                title = slide.contents().attr('title');
            } else if (slide.find('label:first').length>0) {
                slide.find('label:first').hide();
                title = slide.find('label:first').html();
            }
        }

        if (link) title = '<a href="'+link+'" title="'+title+'">'+title+'</a>';

        this.titles[index] = title;

        /**
         * Go to external link by click
         */
        if (this.options.imageLink && link) {
            $(slide).css({cursor:'pointer'})
                .click(function(){
                    document.location = link;
                    return false;
                });
        }

        /**
         * Play/stop on content click (like image and other)
         */
        if (this.options.playClick)
            $(slide).css({cursor:'pointer'})
                .click(function(){
                    if (_self.playId) {
                        _self.stop();
                    } else {
                        _self.play();
                    }
                    return false;
                });

        return false;
    };

    /**
     * Show slideshow
     */
    slideShow.prototype.show = function() {
        this.$slideshow.show();
    };

    /**
     * Bind Events
     */
    slideShow.prototype.bindEvents = function() {
        var _self = this;

        /**
         * Go to next slide on content click (optional)
         */
        if (this.options.nextClick)
            this.$slideshow.find('.aslideshow-content').click(function(){
                _self.stop();
                _self.next();
                return false;
            });

        /**
         * Go to first slide button
         */
        if (this.options.controls.first)
            this.$slideshow.find('a.first').click(function(){
                _self.stop();
                _self.goToSlide(0);
                return false;
            });

        /**
         * Go to previous slide button
         */
        if (this.options.controls.prev)
            this.$slideshow.find('a.prev').click(function(){
                _self.stop();
                _self.prev();
                return false;
            });

        /**
         * Play slideshow button
         */
        if (this.options.controls.play)
            this.$slideshow.find('a.play').click(function(){
                if (_self.playId) {
                    _self.stop();
                } else {
                    _self.play();
                }
                return false;
            });

        /**
         * Go to next slide button
         */
        if (this.options.controls.next)
            this.$slideshow.find('a.next').click(function(){
                _self.stop();
                _self.next();
                return false;
            });

        /**
         * Go to last slide button
         */
        if (this.options.controls.last)
            this.$slideshow.find('a.last').click(function(){
                _self.stop();
                _self.goToSlide(_self.length-1);
                return false;
            });

        /**
         * Show help message
         */
        if (this.options.controls.help)
            this.$slideshow.find('a.help').click(function(){
                _self.stop();
                _self.$slideshow.find('.aslideshow-help').slideToggle();
                return false;
            });

        /**
         * Show frame
         */
        if (this.options.playFrame) {
            this.$slideshow.find('.aslideshow-frame').click(function(){
                _self.$slideshow.find('.aslideshow-frame').remove();

                if (_self.options.playClick)
                    setTimeout(function(){ _self.play() }, _self.options.time);

                return false;
            });
        }

        /**
         * Play/stop on hover
         */
        if (this.options.playHover) {
            this.$slideshow.hover(function(){
                if (!_self.playId) {
                    _self.play();
                }
            }, function(){
                if (_self.playId) {
                    _self.stop();
                }
            });
        }

        /**
         * Stop/Play on hover
         */
        if (this.options.playHoverr) {
            this.$slideshow.hover(function(){
                if (_self.playId) {
                    _self.stop();
                }
            }, function(){
                if (!_self.playId) {
                    _self.play();
                }
            });
        }
    };
    /**
     * Go to N-slide
     * @param {number} n
     */
    slideShow.prototype.goToSlide = function(n) {
        switch (true) {
            case (this.index == n):
            case (!this.initSlide(n)):
                return false;
            default:
                this.goToFlag = true;
                this._goToSlide(n);
                return true;
        }
    };/**
     * Go to N-slide
     * @param {number} n
     */
    slideShow.prototype._goToSlide = function(n) {

        var next = this.$slideshow.find('.aslideshow-content > *:eq('+n+')');
        var prev = this.$slideshow.find('.aslideshow-content > *:eq('+this.index+')');

        // restore next slide after all effects, set z-index = 0 for prev slide
        prev.css({zIndex:0});
        next.css({zIndex:1, top: 0, left: 0, opacity: 1, width: this.options.width, height: this.options.height});

        this.index = n;

        if (this.options.effect == 'random' ) {
            var r = Math.random();
            r = Math.floor(r*12);
        } else {
            r = -1;
        }

        // default animation
        var prevAni = {opacity: 0};

        // effect between slides
        switch (true) {
            case (r == 0 || this.options.effect == 'scrollUp'):
                prev.css({width:'100%'});
                next.css({top:0, height:0});

                prevAni = {height: 0, top:this.options.height};
                break;
            case (r == 1 || this.options.effect == 'scrollDown'):
                prev.css({width:'100%'});
                next.css({top:this.options.height,height:0});

                prevAni = {height: 0, top:0};
                break;
            case (r == 2 || this.options.effect == 'scrollRight'):
                prev.css({right:0,left:'',height:'100%'});
                next.css({right:'',left:0,height:'100%',width:'0%'});

                prevAni = {width: 0};
                break;
            case (r == 3 || this.options.effect == 'scrollLeft'):
                prev.css({right:'',left:0,height:'100%'});
                next.css({right:0,left:'',height:'100%',width:'0%'});

                prevAni = {width: 0};
                break;
            case (r == 4 || this.options.effect == 'growX'):
                next.css({zIndex:2,opacity: 1,left: this.options.width/2, width: '0%', height:'100%'});

                prevAni = {opacity: 0.8};
                break;

            case (r == 5 || this.options.effect == 'growY'):
                next.css({opacity: 1,top: this.options.height/2, width:'100%', height: '0%'});

                prevAni = {opacity: 0.8};
                break;

            case (r == 6 || this.options.effect == 'zoom'):
                next.css({width: 0, height: 0, top: this.options.height/2, left: this.options.width/2});

                prevAni = {width: 0, height: 0, top: this.options.height/2, left: this.options.width/2};
                break;

            case (r == 7 || this.options.effect == 'zoomFade'):
                next.css({zIndex:1, opacity: 0,width: 0, height: 0, top: this.options.height/2, left: this.options.width/2});

                prevAni = {opacity: 0, width: 0, height: 0, top: this.options.height/2, left: this.options.width/2};
                break;

            case (r == 8 || this.options.effect == 'zoomTL'):
                next.css({zIndex:1, opacity: 0,width: this.options.width/2, height: this.options.height/2, top:0, left: 0});

                prevAni = {opacity: 0, width: 0, height: 0, top: this.options.height, left: this.options.width};
                break;
            case (r == 9 || this.options.effect == 'zoomBR'):
                next.css({zIndex:1, opacity: 0,width: this.options.width/2, height: this.options.height/2, top: this.options.height/2, left: this.options.width/2});

                prevAni = {opacity: 0, width: 0, height: 0, top: 0, left: 0};
                break;
            case (r == 10 || this.options.effect == 'fade'):
            default:
                prev.css({zIndex:0, opacity: 1});
                next.css({zIndex:1, opacity: 0});

                break;
        }

        var _self = this;

        prev.animate(prevAni,this.options.effectTime);

        // play next slide animation, hide prev slide, update label, update counter
        next.show().animate(
            {top: 0, left: 0,opacity: 1, width: this.options.width, height: this.options.height},
            this.options.effectTime,
            function () {
                prev.hide();
                if (_self.playFlag) _self._play();
                _self.updateLabel();
                _self.updateCounter();
                _self.updateHash();
                _self.goToFlag = false;

                _self.$container.trigger('slide.aslideshow', [n, $(this)]);
            }
        );
    };
    /**
     * Go to previous slide
     * @method
     */
    slideShow.prototype.prev = function () {
        var i;
        if (this.index == 0) {
            i = (this.length-1);
        } else {
            i = this.index - 1;
        }

        this.goToSlide(i);
    };

    /**
     * Play SlideShow
     * @method
     */
    slideShow.prototype.play = function () {
        var _self = this;
        this.playFlag = true;
        this.playId = setTimeout(function(){ _self.next() }, this.options.time);
        this.$slideshow.find('a.play').addClass('stop');
    };

    /**
     * Play SlideShow
     */
    slideShow.prototype._play = function () {
        var _self = this;

        // if it last frame
        if (this.index == (this.length-1) ) {
            this.stop();
            // should be restart slideshow
            if ( this.options.loop ) {
                this.play();
            }
            return false;
        }
        this.playId = setTimeout(function(){ _self.next(); }, this.options.time);
        return true;
    };

    /**
     * Stop SlideShow
     */
    slideShow.prototype.stop = function () {
        this.playFlag = false;
        this.$slideshow.find('a.play').removeClass('stop');

        clearTimeout(this.playId);
        this.playId = null;
    };

    /**
     * Go to next slide
     */
    slideShow.prototype.next = function () {
        var i;
        if (this.index == (this.length-1)) {
            i = 0;
        } else {
            i = this.index + 1;
        }
        this.goToSlide(i);
    };

    /**
     * Load Image
     *
     * @param {HTMLImageElement} img
     * @param {string} src
     * @param {number} index
     * @return {jQuery} $img
     */
    slideShow.prototype.imageLoad = function (img, src, index) {
        // console.log('Load image '+img);
        var $load = this.$slideshow.find('.aslideshow-load').show();
        var _self = this;
        var $img = $(img);

        $img.load(function(){
            _self.imageZoom(img);
            _self.imageResize(img);
            _self.imageCenter(img);
            _self.goToSlide(index);
            $load.hide();
        }).error(function(){
            // TODO: notify the user that the image could not be loaded
            $load.hide();
        })
        .attr('src', src);

        // fix for stupid browsers
        if (img.complete) {
            _self.imageZoom(img);
            _self.imageResize(img);
            _self.imageCenter(img);
            _self.goToSlide(index);
            $load.hide();
        }
        return $img;
    };

    /**
     * Resize Image
     * @param {HTMLImageElement} img
     * @return {HTMLImageElement} img
     */
    slideShow.prototype.imageResize = function (img) {
        if (!this.options.imageResize && !this.options.fullScreen) {
            return img;
        }

        img.width  = img.style.width = this.options.width;
        img.height = img.style.height = this.options.height;

        return img;
    };

    /**
     * Zoom Image
     * @param {HTMLImageElement} img
     * @return {HTMLImageElement} img
     */
    slideShow.prototype.imageZoom = function (img) {
        if (!this.options.imageZoom) {
            return img;
        }

        var nWidth  = img.width;
        var nHeight = img.height;

        var Kw = this.options.width / nWidth;
        var Kh = this.options.height / nHeight;

        var K  = (Kh > Kw) ? Kh : Kw;

        nWidth  = nWidth * K;
        nHeight = nHeight * K;

        img.width  = img.style.width = nWidth;
        img.height = img.style.height = nHeight;

        return img;
    };

    /**
     * Center Image
     * @param {HTMLImageElement} img
     * @return {HTMLImageElement} img
     */
    slideShow.prototype.imageCenter = function (img){
        if (!this.options.imageCenter) {
            return img;
        }

        var nWidth  = img.width  ? img.width  : img.offsetWidth;
        var nHeight = img.height ? img.height : img.offsetHeight;

        var nLeft   = 0;
        var nTop    = 0;

        if (nWidth != this.options.width) {
            nLeft =  (Math.ceil((this.options.width - nWidth) / 2)) + 'px';
        }

        // Now make sure it isn't taller
        if (nHeight != this.options.height) {
            nTop =  (Math.ceil((this.options.height - nHeight) / 2)) + 'px';
        }

        img.style.left = nLeft;
        img.style.top = nTop;
        img.style.position = 'relative';

        return img;
    };

    slideShow.prototype._check = function() {
        // when animation in progress
        if (this.goToFlag) {
            return;
        }

        // otherwise, check for location.hash
        var hash = document.location.hash;
        hash = hash.length?hash.substr(1):'';

        /*
         - check current url hash
         - is empty
         - goToSlide(0)
         - is exist
         - goToSlide(index)
         */

        if (hash.length == 0) {
            this.goToSlide(0);
        } else {
            var tester = new RegExp('slide-([0-9]+)', 'i');
            if (!tester.test(hash)) {
                // is not slideshow anchor
                return;
            }

            var index = tester.exec(hash);

            if (index) {
                index = parseInt(index[1])-1;
                if (index >= 0
                    && index < this.length
                    && index != this.index ) {
                    // remove play frame
                    if (this.playFrame) {
                        $(this).find('.aslideshow-frame').remove();
                    }
                    this.stop();
                    this.goToSlide(index);
                }
            }
        }
    };
    /**
     * Update page anchor
     */
    slideShow.prototype.updateHash = function () {
        if (this.options.history) {
            document.location.hash = 'slide-' + (this.index + 1);
        }
    };
    slideShow.prototype.updateLabel = function() {
        var title = this.titles[this.index];

        // always load label of slide
        if (!this.options.title) {
            return;
        }

        this.$label.html(title);
    };
    /**
     * Update counter data
     */
    slideShow.prototype.updateCounter = function () {
        if (this.options.controls.counter) {
            this.$slideshow.find('.aslideshow-panel span.counter').html((this.index+1) + ' / ' + this.length);
        }
    };


    /**
     * Create a new instance of slideShow.
     *
     * @classDescription This class creates a new slide show and manipulate it
     *
     * @this {jQuery}
     * @return {object}	Returns a new slideShow object.
     * @constructor
     */
    $.fn.slideshow = function(settings) {

        // public methods
        /*if ( slideshow[settings] ) {
            // check method
            return slideshow[settings].apply( this, Array.prototype.slice.call( arguments, 1 ));
        } else if ( typeof method === 'object' || ! method ) {
            // call initial method
            return slideshow.init.apply( this, arguments );
        } else {
            // wrong call
            $.error('Method "' + settings + '" is not exist');
        }*/

        /**
         * Construct
         */
        this.each(function(){

            var show = new slideShow(this, settings);
            show.build();
            show.show();

            return this;
        });

        /**
         * external functions - append to $
         */
        /*this.playSlide = function(){ this.each(function () { this.play();  }) };
        this.stopSlide = function(){ this.each(function () { this.stop();  }) };
        this.nextSlide = function(){ this.each(function () { this.next();  }) };
        this.prevSlide = function(){ this.each(function () { this.prev();  }) };
        this.getTitle  = function(){ this.each(function () { this.getTitle(); }) };
        this.goToSlide = function(n){ this.each(function () { this.goToSlide(n); }) };*/


        return this;
    }
})(jQuery);