/**
 * jQuery (a) SlideShow plugin
 *
 * Copyright (c) 2009, 2013 Anton Shevchuk
 * Released under the MIT license
 *
 * @author 	Anton Shevchuk AntonShevchuk@gmail.com
 * @version 0.9.0
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

    // public methods
    var slideshow = {
        options:{},
        // initial
        init: function(params) {
            // merge defaults options with initials
            this.options = $.extend({}, defaults, params);
            if (!this.data('aslideshow')) {
                // save options to registry
                this.data('aslideshow', this.options);
            }
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

            var ext = $(this);

            this.playId   = null;
            this.playFlag = false;
			this.playFrame = false;
			this.goToFlag = false;
            this.length   = 0;
            this.inited   = [];
            this.titles   = [];

            /**
             * Build Html
             * @method
             */
            this.build    = function () {
                var _self = this;

                ext.wrapInner('<div class="aslideshow"><div class="aslideshow-content"></div></div>');
                ext = ext.find('.aslideshow');

                // filter content
                if (this.options.filter) {
                    ext.find('.aslideshow-content > br').remove();
                    ext.find('.aslideshow-content > p:empty').remove();
                    ext.find('.aslideshow-content > div:empty').remove();
                }

                // fullScreen
                if (this.options.fullScreen) {
                    $('body').css({overflow:'hidden', padding:0});

                    this.options.width  = $(window).width();
                    this.options.height = ($(window).height()>$(document).height())?$(window).height():$(document).height();

                    ext.addClass('slideshow-fullScreen');
                }

                this.length = ext.find('.aslideshow-content > *').length;

                // build title
                if (this.options.title) {
                    ext.prepend('<div class="aslideshow-label-place"><div class="aslideshow-label aslideshow-opacity"></div></div>');

                    if (!this.options.titleShow) {
                         ext.find('.aslideshow-label-place').hover(function(){
                            $(this).find('.aslideshow-label').fadeIn();
                        }, function() {
                            $(this).find('.aslideshow-label').fadeOut();
                        });
                        ext.find('.aslideshow-label').hide();
                    }
                    ext.find('.aslideshow-label-place').css('width',  this.options.width);
                }

                // build panel
                if (this.options.panel) {
                    ext.append('<div class="aslideshow-panel-place"><div class="aslideshow-panel aslideshow-opacity"></div></div>');
                    panel = ext.find('.aslideshow-panel');
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
                        panel.append('<span class="counter">'+(this.options.index+1)+' / '+this.length+'</span>');
                    }

                    if (this.options.controls.hide) {
                        ext.find('.aslideshow-panel-place').hover(function(){
                            $(this).find('.aslideshow-panel').fadeIn();
                        }, function() {
                            $(this).find('.aslideshow-panel').fadeOut();
                        });
                        panel.hide();
                    }

                    ext.find('.aslideshow-panel-place').css('width',  this.options.width);
                }

                /**
                 * Set Size Options
                 */
                ext.css({width:this.options.width,height:this.options.height});

                var content = ext.find('.aslideshow-content');
                    content.css({width:this.options.width,height:this.options.height});

                // add playFrame
                if (this.options.playFrame) {
					this.playFrame = true;
                    ext.append('<div class="aslideshow-shadow aslideshow-opacity aslideshow-frame"><div></div></div>');
                }

                // add loadFrame
                if (this.options.loadFrame) {
                    ext.append('<div class="aslideshow-shadow aslideshow-opacity aslideshow-load"><div></div></div>');
                }
                ext.find('.aslideshow-shadow').css({width:this.options.width,height:this.options.height});

                // bind all events
                this.events();

                // wrap children
                ext.find('.aslideshow-content > *').each(function(){
                    $(this).wrap('<div class="aslideshow-slide"></div>');
                });

                // check play option
                if (this.options.play) {
                    this.play();
                }

                // init slide (replace by ajax etc)
                this.init(this.options.index);

                // show slide
                ext.find('.aslideshow-slide:eq('+this.options.index+')').show();

                // update label
                this._label();

				// init checker
				if (this.options.history) {
					setInterval(function(){
						_self._check()
					}, 300);
				}

                return true;
            };

            /**
             * Init N-slide
             * @method
             * @param {number} index
             */
            this.init = function (index) {
                // initialize only ones
                for (var i = 0, loopCnt = this.inited.length; i < loopCnt; i++) {
                    if (this.inited[i] === index) {
                        return true;
                    }
                }

                // index to initial stack
                this.inited.push(index);

                // current slide
                var slide = ext.find('.aslideshow-slide:eq('+index+')');

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
                        domain = domain.replace(/\./i,"\.");  // for strong check domain name

                    var reimage = new RegExp("\.(png|gif|jpg|jpeg|svg)$", "i");
                    var relocal = new RegExp("^((https?:\/\/"+domain+")|(?!http:\/\/))", "i");

                    title  = slide.contents().attr('title');
                    if (title.length == 0) title = slide.contents().html();
                    title  = title.replace(/\"/i,'\'');   // if you use single quotes for tag attribs

                    if (this.options.imageAjax && reimage.test(href)) {

                        var img = new Image();
                            img.alt = title;

                        this._load($(img), href, index);

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

                            this._load($(img), slide.contents().attr("src"), index);

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
             * Load Image
             *
             * @param {jQuery} img
             * @param {string} src
             * @param {number} index
             * @return {jQuery} img
             */
            this._load = function (img, src, index) {

			    // console.log('Load image '+img);
                var _load = ext.find('.aslideshow-load').show();
                var _self = this;

                img.load(function(){
                    _self._zoom(img);
                    _self._resize(img);
                    _self._center(img);
                    _self.goToSlide(index);
                    _load.hide();
                }).error(function(){
                    // TODO: notify the user that the image could not be loaded
                    _load.hide();
                })
                .attr('src', src);

                // fix for stupid browsers
                if (img.get(0).complete) {
                    _self._zoom(img);
                    _self._resize(img);
                    _self._center(img);
                    _self.goToSlide(index);
                    _load.hide();
                }
                return img;
            };

            /**
             * Resize Image
             * @param {jQuery} el
             * @return {jQuery} el
             */
            this._resize = function (el) {
                if (!this.options.imageResize && !this.options.fullScreen) {
                    return el;
                }

                el.get(0).width  = this.options.width;
                el.get(0).height = this.options.height;

                el.css({width:this.options.width,height:this.options.height});

                return el;
            };

            /**
             * Zoom Image
             * @param {jQuery} el
             * @return {jQuery} el
             */
            this._zoom = function (el) {
                if (!this.options.imageZoom) {
                    return el;
                }

                var nWidth  = el.get(0).width;
                var nHeight = el.get(0).height;

                var Kw = this.options.width / nWidth;
                var Kh = this.options.height / nHeight;

                var K  = (Kh > Kw) ? Kh : Kw;

                nWidth  = nWidth * K;
                nHeight = nHeight * K;

                el.css({width:nWidth,height:nHeight});

                el.get(0).width  = nWidth;
                el.get(0).height = nHeight;

                return el;
            };

            /**
             * Center Image
             * @param {jQuery} el
             * @return {jQuery} el
             */
            this._center = function (el){
                if (!this.options.imageCenter) {
                    return el;
                }

                var nWidth  = el.get(0).width  ? el.get(0).width  : el.get(0).offsetWidth;
                var nHeight = el.get(0).height ? el.get(0).height : el.get(0).offsetHeight;

                var nLeft   = 0;
                var nTop    = 0;

                if (nWidth != this.options.width) {
                   nLeft =  (Math.ceil((this.options.width - nWidth) / 2)) + 'px';
                }

                // Now make sure it isn't taller
                if (nHeight != this.options.height) {
                   nTop =  (Math.ceil((this.options.height - nHeight) / 2)) + 'px';
                }

                el.css({left:nLeft,top:nTop,position:'relative'});

                return el;
            };

            /**
             * Bind Events
             */
            this.events = function() {

                var _self = this;

                /**
                 * Go to next slide on content click (optional)
                 */
                if (_self.options.nextClick)
                ext.find('.aslideshow-content').click(function(){
                    _self.stop();
                    _self.next();
                    return false;
                });

                /**
                 * Go to first slide button
                 */
                if (this.options.controls.first)
                ext.find('a.first').click(function(){
                    _self.stop();
                    _self.goToSlide(0);
                    return false;
                });

                /**
                 * Go to previous slide button
                 */
                if (this.options.controls.prev)
                ext.find('a.prev').click(function(){
                    _self.stop();
                    _self.prev();
                    return false;
                });

                /**
                 * Play slideshow button
                 */
                if (this.options.controls.play)
                ext.find('a.play').click(function(){
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
                ext.find('a.next').click(function(){
                    _self.stop();
                    _self.next();
                    return false;
                });

                /**
                 * Go to last slide button
                 */
                if (this.options.controls.last)
                ext.find('a.last').click(function(){
                    _self.stop();
                    _self.goToSlide(_self.length-1);
                    return false;
                });

                /**
                 * Show help message
                 */
                if (this.options.controls.help)
                ext.find('a.help').click(function(){
                    _self.stop();
                    ext.find('.aslideshow-help').slideToggle();
                    return false;
                });

                /**
                 * Show frame
                 */
                if (this.options.playFrame) {
                    ext.find('.aslideshow-frame').click(function(){
                        ext.find('.aslideshow-frame').remove();

                        if (_self.options.playClick)
                            setTimeout(function(){ _self.play() }, _self.options.time);

                        return false;
                    });
                }

                /**
                 * Play/stop on hover
                 */
                if (this.options.playHover) {
                    ext.hover(function(){
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
                    ext.hover(function(){
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
             * Update label of slide
             * @return void
             */
            this._label = function () {

                var title = this.getTitle();

                if (this.options.callback) {
                    this.options.callback (this.options.index, title);
                }

                // always load label of slide
                if (!this.options.title) {
                    return;
                }

                ext.find('.aslideshow-label').html(title);
            };

			/**
			 * Update page anchor
			 */
			this._hash = function () {
				 if (this.options.history) {
				 	document.location.hash = 'slide-' + (this.options.index + 1);
				 }
			};

			/**
			 * Interval callback function
			 * need for history navigation
             * @return void
			 */
			this._check = function () {
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
						 && index != this.options.index ) {
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
             * Return title of current slide
             * @method
             */
            this.getTitle = function () {
                return this.titles[this.options.index];
            };

            /**
             * Go to previous slide
             * @method
             */
            this.prev = function () {
                var i;
                if (this.options.index == 0) {
                    i = (this.length-1);
                } else {
                    i = this.options.index - 1;
                }

                this.goToSlide(i);
            };

            /**
             * Play SlideShow
             * @method
             */
            this.play = function () {
                var _self = this;
                this.playFlag = true;
                this.playId = setTimeout(function(){ _self.next() }, this.options.time);
                ext.find('a.play').addClass('stop');
            };

            /**
             * Play SlideShow
             */
            this._play = function () {
                var _self = this;

                // if it last frame
                if (this.options.index == (this.length-1) ) {
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
            this.stop = function () {
                this.playFlag = false;
                ext.find('a.play').removeClass('stop');

                clearTimeout(this.playId);
                this.playId = null;
            };

            /**
             * Go to next slide
             */
            this.next = function () {
                var i;
                if (this.options.index == (this.length-1)) {
                    i = 0;
                } else {
                    i = this.options.index + 1;
                }
                this.goToSlide(i);
            };

            /**
             * Go to N-slide
             * @param {number} n
             */
            this.goToSlide = function(n) {
				switch (true) {
					case (this.options.index == n):
					case (!this.init(n, true)):
						return false;
					default:
						this.goToFlag = true;
						this._goToSlide(n);
						return true;
				}
			};

            /**
             * Go to N-slide
             * @param {number} n
             */
            this._goToSlide = function(n) {

                var next = ext.find('.aslideshow-content > *:eq('+n+')');
                var prev = ext.find('.aslideshow-content > *:eq('+this.options.index+')');

                // restore next slide after all effects, set z-index = 0 for prev slide
                prev.css({zIndex:0});
                next.css({zIndex:1, top: 0, left: 0, opacity: 1, width: this.options.width, height: this.options.height});

                this.options.index = n;

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
                next.show().animate({top: 0, left: 0,opacity: 1, width: this.options.width, height: this.options.height}, this.options.effectTime, function () {
                        prev.hide();
                        if (_self.playFlag) _self._play();
                        _self._label();
                        _self._counter();
						_self._hash();
						_self.goToFlag = false;
                    });
            };

            /**
             * Update counter data
             */
            this._counter = function () {
                if (this.options.controls.counter)
                    ext.find('.aslideshow-panel span.counter').html((this.options.index+1) + ' / ' + this.length);

            };

            // Now initialize the slideshow
            this.options = $.extend({}, defaults, settings);

            if (typeof(settings) != 'undefined') {
                if (typeof(settings.controls) != 'undefined')
                   this.options.controls = $.extend({}, defaults.controls,  settings.controls);
            }

            this.build();

            /**
             * Show slideshow
             */
            ext.show();

            return ext;
        });

        /**
         * external functions - append to $
         */
        this.playSlide = function(){ this.each(function () { this.play();  }) };
        this.stopSlide = function(){ this.each(function () { this.stop();  }) };
        this.nextSlide = function(){ this.each(function () { this.next();  }) };
        this.prevSlide = function(){ this.each(function () { this.prev();  }) };
        this.getTitle  = function(){ this.each(function () { this.getTitle(); }) };
        this.goToSlide = function(n){ this.each(function () { this.goToSlide(n); }) };


        return this;
    }
})(jQuery);